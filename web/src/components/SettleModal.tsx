"use client";

import type { CoverRecord } from "@/lib/contract";
import { formatGen, truncateAddress } from "@/lib/format";

export function SettleModal({
  cover,
  busy,
  error,
  onClose,
  onConfirm,
}: {
  cover: CoverRecord;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-space-md overflow-y-auto bg-on-surface/40 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl bg-surface-container-lowest shadow-2xl flex flex-col my-auto">
        <div className="w-full bg-primary text-on-primary px-space-md py-space-sm flex flex-wrap items-center justify-between gap-space-sm">
          <div className="flex items-center gap-space-sm">
            <span className="bg-on-surface text-surface px-space-xs py-0.5 font-mono-spec text-mono-spec font-bold">
              ACT-02
            </span>
            <span className="font-headline-md text-headline-md uppercase tracking-tight font-bold text-on-primary">
              EXECUTE PERMISSIONLESS SETTLE
            </span>
          </div>
          <button className="hover:bg-on-surface hover:text-surface p-0.5" type="button" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="w-full bg-surface-container-high px-space-md py-space-xs flex flex-wrap items-center justify-between gap-space-sm font-mono-spec text-mono-spec text-on-surface">
          <div className="flex items-center gap-space-xs truncate">
            <span className="text-on-surface-variant font-bold">TARGET CONTRACT:</span>
            <span className="font-bold text-primary">{cover.id}</span>
            <span className="text-on-surface-variant font-bold">PRODUCT:</span>
            <span className="font-bold">{cover.product_key}</span>
          </div>
          <span className="text-tertiary font-bold uppercase">CHAIN ID 61997 / DETERMINISTIC</span>
        </div>
        <div className="p-space-md md:p-space-lg flex flex-col gap-space-lg bg-surface">
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center gap-space-sm">
              <span className="bg-on-surface text-surface font-mono-spec text-mono-spec px-space-xs py-0.5 font-bold">
                [STEP 01]
              </span>
              <span className="font-label-caps text-label-caps uppercase font-bold text-on-surface">
                OPENFDA QUERY INSPECTION
              </span>
            </div>
            <div className="bg-surface-container-highest p-space-sm flex flex-col gap-space-xs font-mono-spec text-mono-spec">
              <span className="font-bold text-[11px] text-on-surface uppercase">RESOLVED API ENDPOINT:</span>
              <div className="p-space-xs bg-surface-container-lowest text-on-surface break-all select-all">
                {cover.query_url || "constructed at settle"}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center gap-space-sm">
              <span className="bg-on-surface text-surface font-mono-spec text-mono-spec px-space-xs py-0.5 font-bold">
                [STEP 02]
              </span>
              <span className="font-label-caps text-label-caps uppercase font-bold text-on-surface">
                PREDICTED FINANCIAL SETTLEMENT MATRIX
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-sm font-mono-spec text-mono-spec">
              <div className="bg-surface-container-low p-space-md">
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">PREMIUM</span>
                <div className="font-bold">{formatGen(cover.premium)}</div>
                <div className="text-on-surface-variant">Buyer {truncateAddress(cover.buyer)}</div>
              </div>
              <div className="bg-surface-container-low p-space-md">
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                  CLASS I CAP 3.0× / CLASS II 2.0×
                </span>
                <div className="font-bold text-tertiary">
                  HIT pays 3x or 2x. NOHIT premium stays. INSUFFICIENT 100% refund.
                </div>
              </div>
            </div>
          </div>
          <div className="bg-surface-container-highest p-space-sm font-mono-spec text-mono-spec text-on-surface-variant">
            <span className="font-bold text-on-surface uppercase">ATOMIC EXECUTION ADVISORY:</span> Settlement is
            deterministic and permissionless on GenLayer Chain 61997. No dispute board. No caller bounty.
          </div>
          {error ? <div className="font-mono-spec text-mono-spec text-error">{error}</div> : null}
          <div className="flex justify-end gap-space-sm">
            <button
              type="button"
              className="border border-on-surface bg-surface px-space-md py-2 font-mono-spec text-mono-spec uppercase font-bold"
              onClick={onClose}
            >
              ABORT
            </button>
            <button
              type="button"
              disabled={busy}
              className="border-2 border-on-surface bg-primary text-on-primary px-space-lg py-2 font-label-caps text-label-caps uppercase font-bold shadow-[2px_2px_0px_#1c1b1b] disabled:opacity-50"
              onClick={onConfirm}
            >
              {busy ? "SIGNING…" : "CONFIRM & SIGN RPC CALL"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
