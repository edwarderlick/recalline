/** Cover IDs come from the contract hash. The UI never mints COVER-0001 style IDs. */

export function isCoverId(id: string | null | undefined): boolean {
  if (!id) return false;
  const t = id.trim();
  if (t.toUpperCase().startsWith("COVER-")) return false;
  return /^0x[0-9a-fA-F]{16,}$/.test(t) || /^[0-9a-fA-F]{32,}$/.test(t);
}

export function normalizeCoverId(id: string): string {
  const t = decodeURIComponent(id || "").trim();
  if (!t) return "";
  if (t.startsWith("0x") || t.startsWith("0X")) return "0x" + t.slice(2).toLowerCase();
  if (/^[0-9a-fA-F]{32,}$/.test(t)) return "0x" + t.toLowerCase();
  return t;
}

export function assertContractId(id: string): string {
  const n = normalizeCoverId(id);
  if (!n) throw new Error("cover id missing");
  return n;
}
