export const GEN_DECIMALS = 18n;

const STATUS_LABELS = {
  OPEN: "Open",
  HIT: "Hit",
  NOHIT: "Nohit",
  INSUFFICIENT: "Insufficient",
  CANCELED: "Canceled",
  EXPIRED: "Expired",
} as const;

export type CoverStatus = keyof typeof STATUS_LABELS;

export function statusLabel(status: string | null | undefined): string {
  const key = String(status || "").toUpperCase() as CoverStatus;
  return STATUS_LABELS[key] ?? String(status || "—");
}

export function toBigInt(v: unknown): bigint {
  if (typeof v === "bigint") return v;
  if (typeof v === "number") return BigInt(Math.trunc(v));
  if (typeof v === "string") {
    const s = v.trim();
    if (!s) return 0n;
    if (s.startsWith("0x") || s.startsWith("0X")) return BigInt(s);
    if (/^\d+$/.test(s)) return BigInt(s);
  }
  return 0n;
}

export function parseGenInput(raw: string): bigint {
  const t = raw.trim().replace(/,/g, "");
  if (!t) return 0n;
  const neg = t.startsWith("-");
  const s = neg ? t.slice(1) : t;
  const [w, f = ""] = s.split(".");
  const whole = BigInt(w || "0");
  const frac = (f + "0".repeat(18)).slice(0, 18);
  const v = whole * 10n ** 18n + BigInt(frac || "0");
  return neg ? -v : v;
}

export function formatGen(
  value: unknown,
  opts?: { digits?: number; suffix?: boolean },
): string {
  const v = toBigInt(value);
  const neg = v < 0n;
  const abs = neg ? -v : v;
  const whole = abs / 10n ** 18n;
  const frac = abs % 10n ** 18n;
  const digits = opts?.digits ?? 2;
  const fracStr = frac.toString().padStart(18, "0").slice(0, digits);
  const wholeStr = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const body = digits > 0 ? `${wholeStr}.${fracStr}` : wholeStr;
  const signed = neg ? `-${body}` : body;
  return opts?.suffix === false ? signed : `${signed} tGEN`;
}

export function truncateAddress(addr: string | null | undefined, size = 4): string {
  if (!addr) return "—";
  const a = addr.startsWith("0x") ? addr : `0x${addr}`;
  if (a.length <= 2 + size * 2) return a;
  return `${a.slice(0, 2 + size)}…${a.slice(-size)}`;
}

export function parseUtc(s: string | null | undefined): Date | null {
  if (!s) return null;
  let t = s.trim().replace(" UTC", "").replace(" utc", "").replace("Z", "+00:00");
  if (t.includes(" ") && !t.includes("T")) t = t.replace(" ", "T");
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) t = t + "T00:00:00+00:00";
  else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(t)) t = t + ":00+00:00";
  else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(t)) t = t + "+00:00";
  const d = new Date(t);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatUtc(s: string | Date | null | undefined): string {
  const d = s instanceof Date ? s : parseUtc(typeof s === "string" ? s : null);
  if (!d) return typeof s === "string" && s ? s : "—";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())} UTC`;
}

export function formatUtcShort(s: string | Date | null | undefined): string {
  const d = s instanceof Date ? s : parseUtc(typeof s === "string" ? s : null);
  if (!d) return "—";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`;
}

export function nowMs(): number {
  return Date.now();
}

export function daysBetween(a: Date, b: Date): number {
  return (b.getTime() - a.getTime()) / 86_400_000;
}
