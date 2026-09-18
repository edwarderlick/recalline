import { statusLabel } from "@/lib/format";

export function StatusBadge({ status, extra }: { status: string; extra?: string }) {
  const s = String(status).toUpperCase();
  const label = extra ? `[${statusLabel(s).toUpperCase()}: ${extra}]` : `[${statusLabel(s).toUpperCase()}]`;
  const cls =
    s === "HIT"
      ? "bg-primary text-on-primary border border-on-surface"
      : s === "INSUFFICIENT"
        ? "bg-error-container text-on-error-container border border-on-surface"
        : s === "NOHIT"
          ? "bg-surface-container-highest border border-on-surface text-on-surface"
          : s === "CANCELED" || s === "EXPIRED"
            ? "bg-surface-variant border border-on-surface text-on-surface-variant"
            : "bg-surface-container-high border border-on-surface text-on-surface";
  return (
    <span className={`${cls} font-mono-spec text-mono-spec font-bold px-space-xs py-0.5 uppercase`}>
      {label}
    </span>
  );
}
