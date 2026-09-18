"use client";

import {
  CALL_KEY_UNNAMED,
  CALL_KEY_WILDCARD,
  createClient,
  encodeExternalMessageFeeParams,
  encodeInternalMessageFeeParams,
  isSuccessful,
  MessageType,
} from "genlayer-js";
import feeProfile from "../../fee-profile.json";
import { CONTRACT_ADDRESS, STUDIO_RPC, studioDevnet } from "./network";
import type { Eip1193Provider } from "./wallet";

export type FeeProfileMethod = keyof typeof feeProfile.methods;

const EMITS_MESSAGES: FeeProfileMethod[] = [
  "buy_cover",
  "settle",
  "cancel",
  "expire",
  "withdraw",
];

/** web.get / run_nondet host messages (internal, on-acceptance). */
const NONDET_HOST: FeeProfileMethod[] = ["buy_cover", "settle"];

/** Only withdraw still emit_transfers on-chain; cancel/expire/HIT credit. */
const PAYS_RECIPIENT: FeeProfileMethod[] = ["withdraw"];

type FeeBundle = {
  distribution: unknown;
  feeValue: unknown;
  messageAllocations?: unknown;
};

type AnyClient = {
  readContract: (args: Record<string, unknown>) => Promise<unknown>;
  writeContract: (args: Record<string, unknown>) => Promise<`0x${string}` | string>;
  estimateTransactionFees?: (args: Record<string, unknown>) => Promise<FeeBundle & { policy?: unknown }>;
  estimateTransactionFeesForWrite?: (args: Record<string, unknown>) => Promise<FeeBundle>;
  getTransaction?: (args: { hash: string }) => Promise<unknown>;
  waitForTransactionReceipt?: (args: Record<string, unknown>) => Promise<unknown>;
  getTransactionReceipt?: (args: { hash: string }) => Promise<unknown>;
};

function browserRpcEndpoint(): string {
  if (typeof window === "undefined") return STUDIO_RPC;
  return "/api/genlayer";
}

function browserChain() {
  const rpc = browserRpcEndpoint();
  const base = studioDevnet as Record<string, unknown>;
  return {
    ...base,
    id: 61997,
    isStudio: true,
    rpcUrls: { default: { http: [rpc] as const } },
  };
}

export function createReadClient(): AnyClient {
  return createClient({
    chain: browserChain() as never,
    endpoint: browserRpcEndpoint(),
  }) as unknown as AnyClient;
}

export function createWalletClient(
  account: `0x${string}`,
  provider: Eip1193Provider,
): AnyClient {
  return createClient({
    chain: browserChain() as never,
    endpoint: browserRpcEndpoint(),
    account,
    provider,
  }) as unknown as AnyClient;
}

function rotationsFrom(count: string | number, appealRounds = 1): bigint[] {
  const n = BigInt(String(count || 1));
  const rounds = Math.max(1, appealRounds + 1);
  return Array.from({ length: rounds }, () => n);
}

export function profileFor(method: FeeProfileMethod | "deploy") {
  if (method === "deploy") return feeProfile.deploy;
  return feeProfile.methods[method];
}

function asAllocList(raw: unknown): Record<string, unknown>[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined;
  return raw as Record<string, unknown>[];
}

function isExternalAlloc(a: Record<string, unknown>): boolean {
  return a.messageType === MessageType.External || a.messageType === 0;
}

function bumpAllocationBudgets(raw: unknown, minBudget: bigint): unknown {
  const list = asAllocList(raw);
  if (!list) return raw;
  return list.map((a) => {
    if (isExternalAlloc(a)) return a;
    const cur = BigInt(String(a.budget ?? 0));
    return { ...a, budget: cur >= minBudget ? cur : minBudget };
  });
}

function allocBudgetSum(raw: unknown): bigint {
  const list = asAllocList(raw);
  if (!list) return 0n;
  return list.reduce((s, a) => s + BigInt(String(a.budget ?? 0)), 0n);
}

function payoutAllocationNodes(
  payoutTo: `0x${string}`,
  internalBudget: bigint,
  internalFeeParams: string,
): Record<string, unknown>[] {
  // get_contract_at(buyer).emit_transfer is an Internal GenVM message (on finalized).
  // Studio then delivers value to the EOA as External; that slot must be exact gas*price.
  const gasLimit = 500_000n;
  const maxGasPrice = 300_000_000n;
  return [
    {
      messageType: MessageType.Internal,
      recipient: payoutTo,
      onAcceptance: false,
      callKey: CALL_KEY_WILDCARD,
      budget: internalBudget,
      feeParams: internalFeeParams,
    },
    {
      messageType: MessageType.External,
      recipient: payoutTo,
      onAcceptance: false,
      callKey: CALL_KEY_UNNAMED,
      budget: gasLimit * maxGasPrice,
      feeParams: encodeExternalMessageFeeParams({ gasLimit, maxGasPrice }),
    },
  ];
}

function mergeAllocations(raw: unknown, extra: Record<string, unknown>[]): unknown {
  const list = asAllocList(raw) ? [...asAllocList(raw)!] : [];
  for (const node of extra) {
    const rec = String(node.recipient).toLowerCase();
    const onA = Boolean(node.onAcceptance);
    const key = String(node.callKey ?? "");
    const exists = list.some(
      (a) =>
        String(a.recipient).toLowerCase() === rec &&
        Boolean(a.onAcceptance ?? false) === onA &&
        String(a.callKey ?? "") === key,
    );
    if (!exists) list.push(node);
  }
  return list.length ? list : raw;
}

async function messageAllocationsFor(
  client: AnyClient,
  method: FeeProfileMethod | "deploy",
  payoutTo?: `0x${string}`,
) {
  if (method === "deploy" || !EMITS_MESSAGES.includes(method as FeeProfileMethod)) {
    return undefined;
  }
  const p = profileFor(method);
  if (!client.estimateTransactionFees) return undefined;
  // Child minPrimary ≈ a one-round internal message. on-acceptance
  // requires budget >= minPrimary * (appealRounds + 1).
  const child = await client.estimateTransactionFees({
    leaderTimeunitsAllocation: BigInt(p.leaderTimeunitsAllocation),
    validatorTimeunitsAllocation: BigInt(p.validatorTimeunitsAllocation),
    executionBudgetPerRound: BigInt(p.executionBudgetPerRound),
    appealRounds: 0n,
    rotations: [1n],
  });
  const minPrimary = BigInt(String(child.feeValue ?? 0));
  const budget = minPrimary * 4n;
  const feeParams = encodeInternalMessageFeeParams({
    leaderTimeunitsAllocation: BigInt(p.leaderTimeunitsAllocation),
    validatorTimeunitsAllocation: BigInt(p.validatorTimeunitsAllocation),
    appealRounds: 0n,
    executionBudgetPerRound: BigInt(p.executionBudgetPerRound),
    rotations: [1n],
  });
  const nodes: Record<string, unknown>[] = [];
  if (NONDET_HOST.includes(method as FeeProfileMethod)) {
    const recipient = (CONTRACT_ADDRESS ||
      "0x0000000000000000000000000000000000000000") as `0x${string}`;
    nodes.push({
      messageType: MessageType.Internal,
      recipient,
      callKey: CALL_KEY_WILDCARD,
      budget,
      feeParams,
    });
  }
  if (PAYS_RECIPIENT.includes(method as FeeProfileMethod) && payoutTo) {
    nodes.push(...payoutAllocationNodes(payoutTo, budget, feeParams));
  }
  return nodes.length ? nodes : undefined;
}

export async function estimateFeesUnchanged(
  client: AnyClient,
  method: FeeProfileMethod | "deploy",
  write?: {
    functionName: string;
    args?: unknown[];
    value?: bigint;
    account?: `0x${string}`;
    payoutTo?: `0x${string}`;
  },
): Promise<FeeBundle> {
  const p = profileFor(method);
  const payoutTo = write?.payoutTo;
  const allocations = await messageAllocationsFor(client, method, payoutTo);
  const minBudget =
    asAllocList(allocations)?.reduce((m, a) => {
      const b = BigInt(String(a.budget ?? 0));
      return b > m ? b : m;
    }, 0n) ?? 0n;
  const seedPayout = asAllocList(allocations)?.filter((a) => a.onAcceptance === false) ?? [];
  const pays = method !== "deploy" && PAYS_RECIPIENT.includes(method as FeeProfileMethod);
  const appealRounds = pays ? 0 : 1;
  const base = {
    leaderTimeunitsAllocation: BigInt(p.leaderTimeunitsAllocation),
    validatorTimeunitsAllocation: BigInt(p.validatorTimeunitsAllocation),
    executionBudgetPerRound: BigInt(p.executionBudgetPerRound),
    appealRounds: BigInt(appealRounds),
    rotations: pays ? [5n] : rotationsFrom(p.rotationsPerRound, 1),
    ...(allocations ? { messageAllocations: allocations } : {}),
  };
  const skipSim = method !== "buy_cover";
  if (!skipSim && write && client.estimateTransactionFeesForWrite) {
    try {
      const simulated = await Promise.race([
        client.estimateTransactionFeesForWrite({
          address: CONTRACT_ADDRESS,
          functionName: write.functionName,
          args: write.args ?? [],
          value: write.value,
          account: write.account ? { address: write.account } : undefined,
          ...base,
        }),
        new Promise<never>((_, rej) =>
          setTimeout(() => rej(new Error("fee simulation timeout")), 12_000),
        ),
      ]);
      const merged = bumpAllocationBudgets(
        mergeAllocations(simulated.messageAllocations ?? allocations, seedPayout),
        minBudget,
      );
      const extra = allocBudgetSum(merged) - allocBudgetSum(simulated.messageAllocations ?? allocations);
      const fv = BigInt(String(simulated.feeValue ?? 0));
      return {
        distribution: simulated.distribution,
        feeValue: extra > 0n ? fv + extra : fv,
        messageAllocations: merged,
      };
    } catch {
      /* profile + allocation tree still funds web.get / emit_transfer */
    }
  }
  if (!client.estimateTransactionFees) {
    throw new Error("estimateTransactionFees unavailable");
  }
  const estimate = await client.estimateTransactionFees(base);
  return {
    distribution: estimate.distribution,
    feeValue: estimate.feeValue,
    messageAllocations: mergeAllocations(
      estimate.messageAllocations ?? allocations,
      seedPayout,
    ),
  };
}

export type TxReceipt = {
  hash: string;
  status: string;
  execution: string;
  result?: unknown;
  deposit?: unknown;
  consumedFee?: unknown;
  refund?: unknown;
  error?: string;
  raw: unknown;
};

/** Protocol TransactionStatus ordinals used by Studio Next receipts. */
const STATUS_NUM: Record<string, string> = {
  "0": "UNINITIALIZED",
  "1": "PENDING",
  "2": "PROPOSING",
  "3": "COMMITTING",
  "4": "REVEALING",
  "5": "ACCEPTED",
  "6": "UNDETERMINED",
  "7": "FINALIZED",
  "8": "CANCELED",
  "9": "APPEAL_REVEALING",
  "10": "APPEAL_COMMITTING",
  "11": "VALIDATORS_TIMEOUT",
  "12": "LEADER_TIMEOUT",
  "13": "LEADER_REVEALING",
};

/** ExecutionResult ordinals. 1 = FINISHED_WITH_RETURN. */
const EXEC_NUM: Record<string, string> = {
  "0": "NOT_VOTED",
  "1": "FINISHED_WITH_RETURN",
  "2": "FINISHED_WITH_ERROR",
  "3": "TIMEOUT",
  "4": "NONDET_DISAGREE",
  "5": "DETERMINISTIC_VIOLATION",
};

function pick(obj: Record<string, unknown>, keys: string[]): unknown {
  for (const k of keys) {
    if (obj[k] != null && obj[k] !== "") return obj[k];
    const lower = k.toLowerCase();
    for (const [ok, ov] of Object.entries(obj)) {
      if (ok.toLowerCase() === lower && ov != null && ov !== "") return ov;
    }
  }
  return undefined;
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function leaderReceipt(raw: Record<string, unknown>): Record<string, unknown> | null {
  const cd = asRecord(raw.consensus_data) || asRecord(raw.consensusData);
  if (!cd) return null;
  const lr = cd.leader_receipt ?? cd.leaderReceipt;
  if (Array.isArray(lr) && lr[0]) return asRecord(lr[0]);
  return asRecord(lr);
}

function normalizeStatus(v: unknown): string {
  if (v == null || v === "") return "";
  const s = String(v).trim();
  if (STATUS_NUM[s]) return STATUS_NUM[s];
  const compact = s.replace(/[\s·._-]+/g, "_").toUpperCase();
  if (compact.includes("FINALIZED")) return "FINALIZED";
  if (compact.includes("ACCEPTED")) return "ACCEPTED";
  return compact;
}

function normalizeExec(v: unknown): string {
  if (v == null || v === "") return "";
  if (typeof v === "object") return "";
  const s = String(v).trim();
  if (EXEC_NUM[s]) return EXEC_NUM[s];
  const u = s.toUpperCase();
  if (u === "SUCCESS" || u === "RETURN") return "FINISHED_WITH_RETURN";
  if (u === "ERROR" || u === "CONTRACT_ERROR") return "FINISHED_WITH_ERROR";
  return u.replace(/\s+/g, "_");
}

function lastTraceLine(stderr: string): string {
  const lines = stderr
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  return lines[lines.length - 1] || stderr.slice(0, 300);
}

function isBenignExecText(s: string): boolean {
  const t = s.trim();
  if (!t) return true;
  return /^(return|success|ok|none|null|undefined|aaa=|majority_agree)$/i.test(t);
}

function extractUserError(raw: Record<string, unknown>, leader: Record<string, unknown> | null): string {
  const acct = asRecord(raw.fee_accounting) || asRecord(asRecord(raw.data)?.fee_accounting);
  const settled = acct && String(acct.settlement_reason || acct.status || "");
  if (settled && /max_generic_retries|canceled|no_majority/i.test(settled)) {
    return settled;
  }
  const candidates: unknown[] = [];
  if (leader) {
    candidates.push(leader.result, leader.genvm_result, leader.execution_result);
    const gr = asRecord(leader.genvm_result);
    if (gr) candidates.push(gr.stderr, gr.error_description, gr.raw_error);
    const res = asRecord(leader.result);
    if (res) candidates.push(res.payload, res.message, res.status);
  }
  candidates.push(raw.result, raw.error, raw.result_name);
  for (const c of candidates) {
    if (typeof c === "string" && c && !isBenignExecText(c) && c !== "SUCCESS") {
      return c.includes("Traceback") ? lastTraceLine(c) : c;
    }
    const o = asRecord(c);
    if (!o) continue;
    const payload = o.payload ?? o.message ?? o.msg;
    if (typeof payload === "string" && payload && !isBenignExecText(payload)) {
      return payload.includes("Traceback") ? lastTraceLine(payload) : payload;
    }
  }
  return "";
}

function flattenReceipt(raw: unknown, hash: string): TxReceipt {
  const obj = asRecord(raw) || {};
  const nested = asRecord(obj.transaction) || asRecord(obj.data) || obj;
  const leader = leaderReceipt(obj) || leaderReceipt(nested);
  const feeObj =
    asRecord(nested.fees) ||
    asRecord(nested.fee) ||
    asRecord(obj.fees) ||
    asRecord(obj.fee) ||
    asRecord(asRecord(nested.fee_accounting)?.paid_fee_value != null ? nested.fee_accounting : null) ||
    nested;
  const acct = asRecord(nested.fee_accounting) || asRecord(obj.fee_accounting);
  const status = normalizeStatus(
    pick(obj, ["statusName", "status_name", "consensus_status", "consensusStatus", "status"]) ??
      pick(nested, ["statusName", "status_name", "status"]),
  );
  const execution = normalizeExec(
    pick(obj, [
      "txExecutionResultName",
      "tx_execution_result_name",
      "txExecutionResult",
      "tx_execution_result",
      "execution_result",
      "executionResult",
    ]) ??
      pick(nested, ["txExecutionResultName", "txExecutionResult", "execution_result"]) ??
      (leader && (leader.execution_result ?? leader.executionResult)),
  );
  let result =
    pick(obj, ["txDataDecoded", "return_value", "returnValue"]) ??
    pick(nested, ["result", "return_value", "output"]);
  if (leader) {
    const lr = leader.result;
    const lro = asRecord(lr);
    if (typeof lr === "string" || typeof lr === "number") result = result ?? lr;
    else if (lro && lro.payload != null && lro.status !== "contract_error") result = result ?? lro.payload;
  }
  const refunds = acct && Array.isArray(acct.refunds) ? acct.refunds : null;
  const refundFromAcct =
    acct?.total_refunded ??
    acct?.primary_fee_refunded ??
    (refunds && asRecord(refunds[0])?.amount);
  return {
    hash,
    status,
    execution,
    result,
    deposit:
      pick(feeObj, ["deposit", "fee_deposit", "feeDeposit", "fee_value", "feeValue", "paid_fee_value"]) ??
      acct?.paid_fee_value ??
      acct?.primary_fee_budget,
    consumedFee:
      pick(feeObj, ["consumed", "consumed_fee", "consumedFee", "execution_fee"]) ??
      asRecord(feeObj.consumed)?.executionConsumed ??
      acct?.execution_fee_consumed ??
      acct?.primary_fee_spent,
    refund: pick(feeObj, ["refund", "fee_refund", "feeRefund"]) ?? refundFromAcct,
    error: extractUserError(obj, leader) || undefined,
    raw,
  };
}

export function isWriteSuccess(receipt: TxReceipt): boolean {
  try {
    if (isSuccessful(receipt.raw as never)) return true;
  } catch {
    /* fall through */
  }
  const st = receipt.status.toUpperCase();
  const okStatus = st === "ACCEPTED" || st === "FINALIZED" || st.includes("ACCEPTED") || st.includes("FINALIZED");
  const okExec = receipt.execution.toUpperCase().includes("FINISHED_WITH_RETURN");
  return okStatus && okExec;
}

function decided(receipt: TxReceipt): boolean {
  const st = receipt.status.toUpperCase();
  return (
    st === "FINALIZED" ||
    st === "ACCEPTED" ||
    st === "CANCELED" ||
    st === "UNDETERMINED" ||
    st.includes("TIMEOUT")
  );
}

function inFlight(receipt: TxReceipt): boolean {
  const st = receipt.status.toUpperCase();
  return (
    st === "UNINITIALIZED" ||
    st === "PENDING" ||
    st === "PROPOSING" ||
    st === "COMMITTING" ||
    st === "REVEALING" ||
    st === "APPEAL_REVEALING" ||
    st === "APPEAL_COMMITTING" ||
    st === "LEADER_REVEALING" ||
    !st
  );
}

export async function waitSuccess(client: AnyClient, hash: string): Promise<TxReceipt> {
  let raw: unknown = null;
  if (client.waitForTransactionReceipt) {
    try {
      raw = await client.waitForTransactionReceipt({
        hash,
        fullTransaction: true,
        waitUntil: "decided",
        retries: 80,
        interval: 3000,
      });
    } catch {
      raw = null;
    }
  }
  if (client.getTransaction) {
    for (let i = 0; i < 80; i++) {
      const latest = await client.getTransaction({ hash });
      if (latest) raw = latest;
      const r = flattenReceipt(raw, hash);
      if (isWriteSuccess(r)) return r;
      if (decided(r) && !inFlight(r)) break;
      await new Promise((res) => setTimeout(res, 3000));
    }
  }
  const receipt = flattenReceipt(raw, hash);
  if (isWriteSuccess(receipt)) return receipt;
  const why = receipt.error ? ` ${receipt.error}` : "";
  if (inFlight(receipt)) {
    throw new Error(
      `write still in consensus: status=${receipt.status || "?"} execution=${receipt.execution || "?"}${why} tx=${hash}`,
    );
  }
  throw new Error(
    `write unsuccessful: status=${receipt.status || "?"} execution=${receipt.execution || "?"}${why} tx=${hash}`,
  );
}

export async function writeMethod(opts: {
  account: `0x${string}`;
  provider: Eip1193Provider;
  functionName: FeeProfileMethod;
  args?: unknown[];
  value?: bigint;
  payoutTo?: `0x${string}`;
  onPhase?: (phase: string) => void;
}): Promise<TxReceipt> {
  if (!CONTRACT_ADDRESS) throw new Error("deploy address missing");
  const client = createWalletClient(opts.account, opts.provider);
  const pays = PAYS_RECIPIENT.includes(opts.functionName);
  const payoutTo = opts.payoutTo ?? (pays ? opts.account : undefined);
  opts.onPhase?.("estimating fees");
  const fees = await estimateFeesUnchanged(client, opts.functionName, {
    functionName: opts.functionName,
    args: opts.args ?? [],
    value: opts.value,
    account: opts.account,
    payoutTo,
  });
  opts.onPhase?.("sign in wallet");
  // Studio Next: in-execution EOA emit_transfer gets leader SUCCESS then
  // an empty validator set / NO_MAJORITY / max_generic_retries_exceeded.
  // leaderOnly skips that committee so the refund can finalize.
  const leaderOnly = opts.functionName === "withdraw";
  const hash = (await client.writeContract({
    address: CONTRACT_ADDRESS,
    functionName: opts.functionName,
    args: opts.args ?? [],
    value: opts.value,
    leaderOnly,
    fees: {
      distribution: fees.distribution,
      feeValue: fees.feeValue,
      messageAllocations: fees.messageAllocations,
    },
  })) as string;
  opts.onPhase?.("waiting consensus");
  return waitSuccess(client, hash);
}

export async function readMethod<T>(
  functionName: string,
  args: unknown[] = [],
): Promise<T> {
  if (!CONTRACT_ADDRESS) throw new Error("deploy address missing");
  const client = createReadClient();
  return (await client.readContract({
    address: CONTRACT_ADDRESS,
    functionName,
    args,
  })) as T;
}
