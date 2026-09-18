"use client";

import { getAddress } from "viem";
import { readMethod, writeMethod, type TxReceipt } from "./genlayer";
import type { Eip1193Provider } from "./wallet";

export type CoverRecord = {
  id: string;
  buyer: string;
  template: string;
  product_key: string;
  window_start_utc: string;
  window_end_utc: string;
  expire_at_utc: string;
  premium: unknown;
  reserve: unknown;
  status: string;
  created_at: string;
  query_url: string;
  classification: string;
  matched_id: string;
  match_reason: string;
  match_date: string;
  payout: unknown;
  refund: unknown;
  hit_i_mult?: number;
  hit_ii_mult?: number;
};

export type Economics = {
  pool_deposited: unknown;
  pool_reserved: unknown;
  pool_available: unknown;
  open_premiums: unknown;
  credits_outstanding: unknown;
  treasury: unknown;
};

function asCover(raw: unknown): CoverRecord {
  const o = (raw || {}) as Record<string, unknown>;
  return {
    id: String(o.id ?? o.cover_id ?? ""),
    buyer: String(o.buyer ?? ""),
    template: String(o.template ?? ""),
    product_key: String(o.product_key ?? ""),
    window_start_utc: String(o.window_start_utc ?? ""),
    window_end_utc: String(o.window_end_utc ?? ""),
    expire_at_utc: String(o.expire_at_utc ?? ""),
    premium: o.premium ?? 0,
    reserve: o.reserve ?? 0,
    status: String(o.status ?? ""),
    created_at: String(o.created_at ?? ""),
    query_url: String(o.query_url ?? ""),
    classification: String(o.classification ?? ""),
    matched_id: String(o.matched_id ?? ""),
    match_reason: String(o.match_reason ?? ""),
    match_date: String(o.match_date ?? ""),
    payout: o.payout ?? 0,
    refund: o.refund ?? 0,
    hit_i_mult: Number(o.hit_i_mult ?? 3),
    hit_ii_mult: Number(o.hit_ii_mult ?? 2),
  };
}

export async function get_cover(id: string): Promise<CoverRecord> {
  const raw = await readMethod<unknown>("get_cover", [id]);
  return asCover(raw);
}

export async function list_ids(): Promise<string[]> {
  const raw = await readMethod<unknown>("list_ids", []);
  if (Array.isArray(raw)) return raw.map((x) => String(x));
  return [];
}

export async function get_cover_ids(): Promise<string[]> {
  const raw = await readMethod<unknown>("get_cover_ids", []);
  if (Array.isArray(raw)) return raw.map((x) => String(x));
  return list_ids();
}

export async function get_economics(): Promise<Economics> {
  const raw = (await readMethod<Record<string, unknown>>("get_economics", [])) || {};
  return {
    pool_deposited: raw.pool_deposited ?? 0,
    pool_reserved: raw.pool_reserved ?? 0,
    pool_available: raw.pool_available ?? 0,
    open_premiums: raw.open_premiums ?? 0,
    credits_outstanding: raw.credits_outstanding ?? 0,
    treasury: raw.treasury ?? 0,
  };
}

function parseCredit(raw: unknown): bigint {
  if (typeof raw === "bigint") return raw;
  if (typeof raw === "number") return BigInt(Math.trunc(raw));
  if (typeof raw === "string" && raw) return BigInt(raw);
  return 0n;
}

function creditKeys(addr: string): string[] {
  const raw = (addr || "").trim();
  if (!raw) return [];
  const lower = raw.toLowerCase();
  const out = [raw, lower];
  try {
    out.push(getAddress(raw));
  } catch {
    /* not a 20-byte address */
  }
  return [...new Set(out)];
}

export async function get_credit(addr: string): Promise<bigint> {
  for (const key of creditKeys(addr)) {
    try {
      const v = parseCredit(await readMethod<unknown>("get_credit", [key]));
      if (v > 0n) return v;
    } catch {
      /* try next encoding */
    }
  }
  return 0n;
}

export async function fund_pool(
  account: `0x${string}`,
  provider: Eip1193Provider,
  value: bigint,
): Promise<TxReceipt> {
  return writeMethod({ account, provider, functionName: "fund_pool", args: [], value });
}

export async function buy_cover(
  account: `0x${string}`,
  provider: Eip1193Provider,
  args: {
    template: string;
    product_key: string;
    window_start_utc: string;
    window_end_utc: string;
    premium: bigint;
  },
): Promise<TxReceipt> {
  return writeMethod({
    account,
    provider,
    functionName: "buy_cover",
    args: [args.template, args.product_key, args.window_start_utc, args.window_end_utc],
    value: args.premium,
  });
}

export async function cancel(
  account: `0x${string}`,
  provider: Eip1193Provider,
  id: string,
  payoutTo?: `0x${string}`,
  onPhase?: (phase: string) => void,
): Promise<TxReceipt> {
  return writeMethod({
    account,
    provider,
    functionName: "cancel",
    args: [id],
    payoutTo: payoutTo ?? account,
    onPhase,
  });
}

export async function settle(
  account: `0x${string}`,
  provider: Eip1193Provider,
  id: string,
  payoutTo?: `0x${string}`,
): Promise<TxReceipt> {
  return writeMethod({
    account,
    provider,
    functionName: "settle",
    args: [id],
    payoutTo,
  });
}

export async function expire(
  account: `0x${string}`,
  provider: Eip1193Provider,
  id: string,
  payoutTo?: `0x${string}`,
): Promise<TxReceipt> {
  return writeMethod({
    account,
    provider,
    functionName: "expire",
    args: [id],
    payoutTo,
  });
}

export async function withdraw(
  account: `0x${string}`,
  provider: Eip1193Provider,
): Promise<TxReceipt> {
  return writeMethod({
    account,
    provider,
    functionName: "withdraw",
    args: [],
    payoutTo: account,
  });
}
