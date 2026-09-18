"use client";

import type { CoverRecord } from "@/lib/contract";
import { formatGen, formatUtc, truncateAddress } from "@/lib/format";

export function CancelModal({
  cover,
  busy,
  phase,
  error,
  onClose,
  onConfirm,
}: {
  cover: CoverRecord;
  busy: boolean;
  phase?: string | null;
  error: string | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-space-sm md:p-space-md bg-on-surface/60 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-3xl bg-surface border-[1.5px] border-on-surface shadow-[8px_8px_0px_#1c1b1b] my-auto">
        <div className="w-full bg-surface-container-lowest border-b-[1.5px] border-on-surface px-space-md py-space-sm flex items-center justify-between gap-space-sm">
          <div className="flex items-center gap-space-sm min-w-0">
            <div className="bg-primary text-on-primary font-mono-spec text-mono-spec font-bold px-1.5 py-0.5 shrink-0">
              ACT-03
            </div>
            <span className="font-headline-md text-body-lg md:text-headline-md uppercase font-bold tracking-tight text-on-surface truncate">
              EXECUTE PRE-WINDOW CANCELLATION
            </span>
          </div>
          <button
            type="button"
            className="shrink-0 w-8 h-8 border border-on-surface bg-surface hover:bg-surface-container-highest font-mono-spec text-mono-index font-bold"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <div className="w-full bg-surface-container-high border-b border-on-surface px-space-md py-1.5 font-mono-spec text-mono-spec">
          TARGET: <span className="font-bold">{cover.id}</span> // {cover.product_key} // CHAIN: 61997
        </div>
        <div className="p-space-md md:p-space-lg space-y-space-md">
          <div className="border border-on-surface bg-surface-container-lowest p-space-md space-y-space-sm">
            <div className="flex items-center gap-space-xs">
              <span className="bg-on-surface text-surface font-mono-spec text-mono-spec font-bold px-1 py-0.5">
                [STEP 01]
              </span>
              <span className="font-label-caps text-label-caps uppercase font-bold text-on-surface">
                TEMPORAL LOCK INTERLOCK
              </span>
            </div>
            <p className="font-mono-spec text-mono-spec">
              Cancellations permitted while status is OPEN and now &lt; window_start ({formatUtc(cover.window_start_utc)}).
            </p>
          </div>
          <div className="border border-on-surface bg-surface-container-lowest p-space-md">
            <div className="flex items-center gap-space-xs mb-space-sm">
              <span className="bg-on-surface text-surface font-mono-spec text-mono-spec font-bold px-1 py-0.5">
                [STEP 02]
              </span>
              <span className="font-label-caps text-label-caps uppercase font-bold text-on-surface">
                ESCROW BREAKDOWN & CAPITAL RESTITUTION
              </span>
            </div>
            <div className="divide-y divide-on-surface border border-on-surface bg-surface font-mono-spec text-mono-spec">
              <div className="flex items-center justify-between p-space-xs px-space-sm">
                <span className="text-on-surface-variant uppercase">Premium Locked in Escrow</span>
                <span className="font-bold">{formatGen(cover.premium)}</span>
              </div>
              <div className="flex items-center justify-between p-space-xs px-space-sm bg-surface-container-low">
                <span className="text-on-surface-variant uppercase">Cancellation Penalty / Protocol Fee</span>
                <span className="font-bold text-tertiary">0.00 tGEN (0.00% Zero Deduction)</span>
              </div>
              <div className="flex items-center justify-between p-space-sm bg-primary-fixed">
                <div className="flex flex-col">
                  <span className="font-label-caps text-label-caps text-on-primary-fixed uppercase font-bold">
                    NET REFUND DISPATCHED TO BUYER
                  </span>
                  <span className="text-on-primary-fixed-variant text-[11px]">
                    RECIPIENT: {truncateAddress(cover.buyer)}
                  </span>
                </div>
                <div className="font-headline-md text-headline-md font-bold text-primary tracking-tight">
                  +{formatGen(cover.premium)}
                </div>
              </div>
            </div>
          </div>
          {error ? <div className="font-mono-spec text-mono-spec text-error">{error}</div> : null}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-space-sm pt-space-xs">
            <button
              type="button"
              className="sm:col-span-4 h-12 bg-surface hover:bg-surface-container-high border-[1.5px] border-on-surface shadow-[3px_3px_0px_#1c1b1b] font-label-caps text-label-caps uppercase font-bold"
              onClick={onClose}
            >
              [ CANCEL & ABORT ]
            </button>
            <button
              type="button"
              disabled={busy}
              className="sm:col-span-8 h-12 bg-primary-container text-on-primary-container hover:bg-primary border-[1.5px] border-on-surface shadow-[3px_3px_0px_#1c1b1b] font-headline-md text-body-md uppercase font-bold disabled:opacity-50"
              onClick={onConfirm}
            >
              {busy
                ? (phase || "working").toUpperCase() + "…"
                : "CONFIRM CANCEL & REFUND"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
