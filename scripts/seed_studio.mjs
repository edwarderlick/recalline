/**
 * Seed Studio Next: fund 30 tGEN, buy fake NDC, cancel.
 * Uses unlocked genlayer-cli keychain account. Never prints the key.
 */
import { createRequire } from "node:module";
import {
  CALL_KEY_WILDCARD,
  createAccount,
  createClient,
  encodeInternalMessageFeeParams,
  MessageType,
} from "genlayer-js";
import { studioDevnet } from "genlayer-js/chains";

const require = createRequire(import.meta.url);
const keytar = require("keytar");

const RPC = "https://studio-dev.genlayer.com/api";
const IC = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0xAC3498A0A8f38C3b916F9fAf80B4AFfF23f03B84";
const ACCOUNT = process.env.GENLAYER_ACCOUNT || "coverlock-challenger";
const THIRTY = 30n * 10n ** 18n;
const TEN = 10n * 10n ** 18n;

function chain() {
  return {
    ...studioDevnet,
    id: 61997,
    isStudio: true,
    rpcUrls: { default: { http: [RPC] } },
  };
}

async function waitOk(client, hash) {
  const rec = await client.waitForTransactionReceipt({
    hash,
    retries: 80,
    interval: 3000,
    waitUntil: "decided",
    fullTransaction: true,
  });
  const st = String(rec.status ?? rec.statusName ?? "").toUpperCase();
  const ex = String(rec.txExecutionResultName ?? rec.execution ?? "").toUpperCase();
  console.log("receipt", hash, st, ex);
  const ok =
    st.includes("ACCEPTED") ||
    st.includes("FINALIZED") ||
    st === "5" ||
    st === "7";
  if (!ok) {
    throw new Error(`not decided-ok: ${st} ${ex} ${hash}`);
  }
  if (ex && !ex.includes("RETURN") && ex.includes("ERROR")) {
    throw new Error(`execution error: ${ex} ${hash}`);
  }
  return rec;
}

async function main() {
  const pk = await keytar.getPassword("genlayer-cli", `account:${ACCOUNT}`);
  if (!pk) throw new Error(`keystore ${ACCOUNT} is not unlocked`);
  const account = createAccount(pk);
  console.log("signer", account.address);
  const client = createClient({ chain: chain(), endpoint: RPC, account });

  async function feesFor(method, extra = {}) {
    const est = await client.estimateTransactionFees({
      leaderTimeunitsAllocation: method === "buy_cover" ? 250n : 125n,
      validatorTimeunitsAllocation: method === "buy_cover" ? 500n : 250n,
      executionBudgetPerRound: 25000000000000000n,
      appealRounds: 1n,
      rotations: [1n, 1n],
    });
    return { distribution: est.distribution, feeValue: est.feeValue, ...extra };
  }

  let eco0 = await client.readContract({ address: IC, functionName: "get_economics", args: [] });
  let fundHash = null;
  if (BigInt(String(eco0.pool_deposited ?? 0)) < THIRTY) {
    fundHash = await client.writeContract({
      address: IC,
      functionName: "fund_pool",
      args: [],
      value: THIRTY,
      fees: await feesFor("fund_pool"),
    });
    console.log("fund_pool", fundHash);
    await waitOk(client, fundHash);
  } else {
    console.log("pool already funded", String(eco0.pool_deposited));
  }

  const start = new Date(Date.now() + 26 * 3600 * 1000);
  start.setUTCMinutes(0, 0, 0);
  const end = new Date(start.getTime() + 24 * 3600 * 1000);
  const iso = (d) => d.toISOString().replace(/\.\d{3}Z$/, "Z");
  const child = await client.estimateTransactionFees({
    leaderTimeunitsAllocation: 250n,
    validatorTimeunitsAllocation: 500n,
    executionBudgetPerRound: 25000000000000000n,
    appealRounds: 0n,
    rotations: [1n],
  });
  const buyAlloc = [
    {
      messageType: MessageType.Internal,
      recipient: IC,
      callKey: CALL_KEY_WILDCARD,
      budget: BigInt(String(child.feeValue ?? 0)) * 4n,
      feeParams: encodeInternalMessageFeeParams({
        leaderTimeunitsAllocation: 250n,
        validatorTimeunitsAllocation: 500n,
        appealRounds: 0n,
        executionBudgetPerRound: 25000000000000000n,
        rotations: [1n],
      }),
    },
  ];
  const buyFees = await client.estimateTransactionFees({
    leaderTimeunitsAllocation: 250n,
    validatorTimeunitsAllocation: 500n,
    executionBudgetPerRound: 25000000000000000n,
    appealRounds: 1n,
    rotations: [1n, 1n],
    messageAllocations: buyAlloc,
  });
  const buyHash = await client.writeContract({
    address: IC,
    functionName: "buy_cover",
    args: ["DRUG_NDC", "00000-0000-00", iso(start), iso(end)],
    value: TEN,
    fees: {
      distribution: buyFees.distribution,
      feeValue: buyFees.feeValue,
      messageAllocations: buyFees.messageAllocations ?? buyAlloc,
    },
  });
  console.log("buy_cover", buyHash);
  await waitOk(client, buyHash);

  const ids = await client.readContract({ address: IC, functionName: "list_ids", args: [] });
  console.log("ids", ids);
  const id = ids[ids.length - 1];
  const cover = await client.readContract({ address: IC, functionName: "get_cover", args: [id] });
  console.log("cover", cover.status, cover.product_key, cover.window_start_utc);

  const cancelHash = await client.writeContract({
    address: IC,
    functionName: "cancel",
    args: [id],
    fees: await feesFor("cancel"),
  });
  console.log("cancel", cancelHash);
  await waitOk(client, cancelHash);

  const after = await client.readContract({ address: IC, functionName: "get_cover", args: [id] });
  const eco = await client.readContract({ address: IC, functionName: "get_economics", args: [] });
  const credit = await client.readContract({
    address: IC,
    functionName: "get_credit",
    args: [account.address],
  });
  console.log("SEED_OK", JSON.stringify({
    ic: IC,
    coverId: id,
    status: after.status,
    refund: String(after.refund),
    credit: String(credit),
    eco: {
      pool_deposited: String(eco.pool_deposited),
      pool_reserved: String(eco.pool_reserved),
      pool_available: String(eco.pool_available),
      credits_outstanding: String(eco.credits_outstanding),
    },
    txs: { fund: fundHash, buy: buyHash, cancel: cancelHash },
  }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
