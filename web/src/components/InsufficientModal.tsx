"use client";

import type { CoverRecord } from "@/lib/contract";
import { formatGen } from "@/lib/format";

export function InsufficientModal({
  cover,
  onClose,
}: {
  cover: CoverRecord;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-inverse-surface/85 backdrop-blur-md flex items-center justify-center p-space-sm md:p-space-lg overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-surface-bright text-on-surface shadow-2xl my-auto">
        <div className="w-full bg-surface-container-highest px-space-md py-space-xs flex flex-wrap items-center justify-between gap-space-xs">
          <div className="flex items-center gap-space-sm font-mono-spec text-mono-spec tracking-wider uppercase">
            <span className="inline-flex items-center px-1.5 py-0.5 bg-primary text-on-primary font-bold">FAULT LOG</span>
            <span className="font-bold text-primary">STATUS: EXCEPTION_TERMINAL</span>
          </div>
          <span className="text-primary font-mono-spec font-bold animate-pulse">● HALTED</span>
        </div>
        <div className="px-space-md md:px-space-lg py-space-md bg-surface flex items-start justify-between gap-space-md">
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center gap-space-sm">
              <span className="px-space-xs py-0.5 bg-on-surface text-surface font-mono-spec text-mono-spec font-bold">
                [DIAG-04]
              </span>
              <h2 className="font-headline-md text-headline-md uppercase font-bold text-on-surface tracking-tight">
                FAULT DIAGNOSTIC <span className="text-primary">// INSUFFICIENT FEED RESOLUTION TERMINAL</span>
              </h2>
            </div>
            <div className="font-mono-spec text-mono-spec text-on-surface-variant">
              CONTRACT: <strong className="text-on-surface">{cover.id}</strong> // PRODUCT:{" "}
              <strong className="text-on-surface">{cover.product_key}</strong>
            </div>
          </div>
          <button
            type="button"
            className="shrink-0 w-10 h-10 bg-surface-container-high hover:bg-primary hover:text-on-primary text-on-surface font-mono-spec text-mono-index font-bold"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <div className="px-space-md md:px-space-lg py-space-sm bg-primary-fixed text-on-primary-fixed font-mono-spec text-mono-spec uppercase font-bold">
          UPSTREAM FDA ORACLE INACCESSIBLE — AUTOMATIC NON-SPECULATION SAFETY PROTOCOL TRIGGERED
        </div>
        <div className="p-space-md md:p-space-lg flex flex-col gap-space-lg bg-surface-container-low">
          <div className="bg-surface p-space-md flex flex-col gap-space-sm shadow-sm">
            <div className="flex items-center gap-space-sm">
              <span className="font-mono-spec text-mono-spec font-bold text-primary">[STEP 01]</span>
              <span className="font-label-caps text-label-caps uppercase font-bold text-on-surface tracking-wider">
                ORACLE FEED AUDIT & EXCEPTION TRACE
              </span>
            </div>
            <div className="bg-inverse-surface text-inverse-on-surface p-space-sm font-mono-spec text-mono-spec">
              <div className="text-[11px] font-bold uppercase">TARGET REST ENDPOINT (OFFICIAL OPENFDA JSON API):</div>
              <div className="p-space-xs bg-black/40 text-secondary-container break-all select-all text-[11px]">
                {cover.query_url}
              </div>
              <div className="pt-space-xs text-[11px]">
                REASON: <span className="text-primary-fixed-dim font-bold">{cover.match_reason || "insufficient"}</span>
              </div>
            </div>
            <div className="bg-surface-container p-space-sm font-mono-spec text-mono-spec">
              EXCEPTION CLASSIFICATION: ORACLE_FEED_UNREACHABLE_OR_MALFORMED. Feed-status only — no validator vote
              theater.
            </div>
          </div>
          <div className="bg-surface p-space-md flex flex-col gap-space-sm shadow-sm">
            <div className="flex items-center gap-space-sm">
              <span className="font-mono-spec text-mono-spec font-bold text-tertiary">[STEP 02]</span>
              <span className="font-label-caps text-label-caps uppercase font-bold text-on-surface tracking-wider">
                DETERMINISTIC FAILSAFE RESTITUTION MATRIX
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-sm font-mono-spec">
              <div className="bg-surface-container p-space-md">
                <span className="text-on-surface-variant text-[11px] uppercase tracking-wider">
                  ESCROW ASSET // BUYER REFUND
                </span>
                <span className="font-headline-md text-headline-md font-bold text-on-surface block">
                  {formatGen(cover.refund || cover.premium)}
                </span>
              </div>
              <div className="bg-surface-container p-space-md">
                <span className="text-on-surface-variant text-[11px] uppercase tracking-wider">STATUS</span>
                <span className="font-headline-md text-headline-md font-bold text-on-surface block">INSUFFICIENT</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
