import { parseUtc, toBigInt } from "./format";
import type { CoverRecord } from "./contract";

export function isOpen(status: string): boolean {
  return String(status).toUpperCase() === "OPEN";
}

export function isTerminal(status: string): boolean {
  const s = String(status).toUpperCase();
  return s === "HIT" || s === "NOHIT" || s === "INSUFFICIENT" || s === "CANCELED" || s === "EXPIRED";
}

export function canCancel(cover: CoverRecord, now: Date, address: string | null): boolean {
  if (!isOpen(cover.status)) return false;
  if (!address || address.toLowerCase() !== cover.buyer.toLowerCase()) return false;
  const start = parseUtc(cover.window_start_utc);
  if (!start) return false;
  return now.getTime() < start.getTime();
}

export function canSettle(cover: CoverRecord, now: Date): boolean {
  if (!isOpen(cover.status)) return false;
  const end = parseUtc(cover.window_end_utc);
  const exp = parseUtc(cover.expire_at_utc);
  if (!end || !exp) return false;
  return now.getTime() >= end.getTime() && now.getTime() < exp.getTime();
}

export function canExpire(cover: CoverRecord, now: Date): boolean {
  if (!isOpen(cover.status)) return false;
  const exp = parseUtc(cover.expire_at_utc);
  if (!exp) return false;
  return now.getTime() >= exp.getTime();
}

export function maxPayout(cover: CoverRecord): bigint {
  const p = toBigInt(cover.premium);
  const m = BigInt(cover.hit_i_mult ?? 3);
  return p * m;
}

export function constructQueryUrl(cover: CoverRecord): string {
  if (cover.query_url) return cover.query_url;
  return "";
}
