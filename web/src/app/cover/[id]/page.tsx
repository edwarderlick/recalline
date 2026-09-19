"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CancelModal } from "@/components/CancelModal";
import { InsufficientModal } from "@/components/InsufficientModal";
import { ReceiptPanel } from "@/components/ReceiptPanel";
import { SettleModal } from "@/components/SettleModal";
import { StatusBadge } from "@/components/StatusBadge";
import { cancel, expire, get_cover, settle, type CoverRecord } from "@/lib/contract";
import { canCancel, canExpire, canSettle, isTerminal, maxPayout } from "@/lib/coverState";
import { formatGen, formatUtc, formatUtcShort, truncateAddress } from "@/lib/format";
import type { TxReceipt } from "@/lib/genlayer";
import { withTimeout } from "@/lib/genlayer";
import { normalizeCoverId } from "@/lib/ids";
import { CONTRACT_ADDRESS, missingDeployAddress } from "@/lib/network";
import { useWallet } from "@/lib/WalletContext";

export default function CoverDetailPage() {
  const params = useParams<{ id: string }>();
  const id = normalizeCoverId(String(params?.id || ""));
  const w = useWallet();
  const [cover, setCover] = useState<CoverRecord | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"settle" | "cancel" | "insufficient" | null>(null);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<string | null>(null);
  const [txErr, setTxErr] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<TxReceipt | null>(null);
  const now = useMemo(() => new Date(), [cover?.status]);

  const load = useCallback(async () => {
    if (missingDeployAddress()) {
      setErr("deploy address missing");
      setLoading(false);
      return;
    }
    try {
      setCover(await withTimeout(get_cover(id), 12_000, "get_cover"));
      setErr(null);
    } catch (e) {
      setCover(null);
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function run(kind: "settle" | "cancel" | "expire") {
    if (!w.address || !w.provider) {
      setTxErr("connect wallet");
      return;
    }
    setBusy(true);
    setPhase("working");
    setTxErr(null);
    try {
      const buyer = (cover?.buyer || w.address) as `0x${string}`;
      const r =
        kind === "settle"
          ? await settle(w.address as `0x${string}`, w.provider, id, buyer)
          : kind === "cancel"
            ? await cancel(w.address as `0x${string}`, w.provider, id, buyer, setPhase)
            : await expire(w.address as `0x${string}`, w.provider, id, buyer);
      setReceipt(r);
      setModal(null);
      await load();
      await w.refresh();
    } catch (e) {
      setTxErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
      setPhase(null);
    }
  }

  if (loading) {
    return <div className="p-space-lg font-mono-spec text-mono-spec">LOADING get_cover… (12s cap)</div>;
  }
  if (err || !cover) {
    return (
      <div className="p-space-lg font-mono-spec text-mono-spec flex flex-col gap-space-sm max-w-3xl">
        <div className="text-error whitespace-pre-wrap break-all">{err || "unknown cover"}</div>
        <div className="text-on-surface-variant">
          COVER ID {id || "—"}
          <br />
          CONTRACT {CONTRACT_ADDRESS || "missing"}
        </div>
        <button
          type="button"
          className="border-2 border-on-surface px-space-md py-space-sm font-bold uppercase w-fit"
          onClick={() => {
            setLoading(true);
            setErr(null);
            void load();
          }}
        >
          RETRY get_cover
        </button>
      </div>
    );
  }

  const showCancel = canCancel(cover, now, w.address);
  const showSettle = canSettle(cover, now);
  const showExpire = canExpire(cover, now);
  const terminal = isTerminal(cover.status);
  const matchNeverTrunc = {
    classification: cover.classification,
    matched_id: cover.matched_id,
    match_reason: cover.match_reason,
    match_date: cover.match_date,
  };

  return (
    <div className="flex flex-col w-full">
      <section className="w-full bg-surface-container border-b border-on-surface px-space-md lg:px-space-lg py-space-sm">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-space-sm font-mono-spec text-mono-spec">
          <div className="flex items-center gap-space-sm">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-tertiary text-on-tertiary font-bold uppercase tracking-wider text-label-caps">
              <span className="w-2 h-2 rounded-full bg-tertiary-fixed animate-pulse" />
              STATE: {cover.status}
              {showSettle ? " // RIPE FOR SETTLEMENT" : ""}
            </span>
            <span className="text-on-surface uppercase font-bold">COVER ORACLE INTERFACE</span>
          </div>
          <div className="flex items-center gap-1 text-on-surface">
            <span className="font-bold">CONTRACT:</span>
            <span className="text-primary font-bold">{truncateAddress(cover.id, 6)}</span>
            <button
              className="ml-1 p-0.5 hover:bg-surface-container-highest"
              type="button"
              onClick={() => void navigator.clipboard.writeText(cover.id)}
            >
              <span className="material-symbols-outlined text-[14px]">content_copy</span>
            </button>
          </div>
        </div>
      </section>

      <div className="w-full max-w-7xl mx-auto px-space-md lg:px-space-lg py-space-lg lg:py-space-xl flex flex-col gap-space-xl">
        <div className="w-full bg-surface-container-lowest border-2 border-on-surface shadow-[4px_4px_0px_#1c1b1b]">
          <div className="w-full border-b-2 border-on-surface bg-surface-container px-space-md py-space-xs flex flex-wrap items-center justify-between gap-space-sm">
            <span className="font-headline-md text-mono-spec uppercase font-bold tracking-tight text-on-surface">
              PARAMETRIC {cover.template} COVER UNIT
            </span>
            <span className="bg-secondary text-on-secondary px-2 py-0.5 text-label-caps font-bold">ATOMIC AUTOMATION</span>
          </div>
          <div className="p-space-md lg:p-space-lg grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
            <div className="lg:col-span-8 flex flex-col gap-space-sm">
              <div className="flex items-center gap-space-xs flex-wrap">
                <span className="font-mono-spec text-mono-spec px-2 py-0.5 bg-primary-fixed text-on-primary-fixed font-bold">
                  TEMPLATE: {cover.template}
                </span>
                <StatusBadge status={cover.status} extra={cover.classification || undefined} />
              </div>
              <h1 className="font-headline-xl text-headline-xl tracking-tighter uppercase font-bold text-on-surface mt-1">
                {cover.product_key}{" "}
                <span className="text-primary font-normal text-headline-lg font-mono-spec">// {cover.id}</span>
              </h1>
            </div>
            <div className="lg:col-span-4 flex flex-col border border-on-surface bg-surface-container-low p-space-md">
              <div className="flex items-center justify-between border-b border-on-surface pb-space-xs mb-space-xs">
                <span className="font-label-caps text-label-caps uppercase text-on-surface-variant font-bold">
                  DEVICE STATUS
                </span>
                <span className="font-mono-spec text-mono-spec text-tertiary font-bold">{cover.status}</span>
              </div>
              <div className="flex justify-between font-mono-spec text-mono-spec">
                <span className="text-on-surface-variant">LOCKED PREMIUM:</span>
                <span className="font-bold">{formatGen(cover.premium)}</span>
              </div>
              <div className="flex justify-between font-mono-spec text-mono-spec">
                <span className="text-on-surface-variant">MAX RESERVED PAYOUT:</span>
                <span className="font-bold text-primary">{formatGen(maxPayout(cover))}</span>
              </div>
            </div>
          </div>
          <div className="border-t-2 border-on-surface bg-surface-container-low p-space-md">
            <div className="flex items-center justify-between mb-space-xs">
              <span className="font-label-caps text-label-caps uppercase font-bold text-on-surface">
                PARAMETRIC WINDOW TIMELINE CHRONOMETER
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 border border-on-surface bg-surface-container p-2">
              {[
                ["[01] PURCHASE", formatUtcShort(cover.created_at), "Buyable Cutoff UTC"],
                ["[02] WINDOW START", formatUtcShort(cover.window_start_utc), "Refund Window"],
                ["[03] WINDOW END", formatUtcShort(cover.window_end_utc), showSettle ? "Settle Ripe: YES" : ""],
                ["[04] CONTRACT EXP", formatUtcShort(cover.expire_at_utc), "7-Day Settle Grace"],
              ].map((row) => (
                <div key={row[0]} className="bg-surface-container-lowest border border-on-surface p-space-xs">
                  <div className="font-mono-spec text-mono-spec text-on-surface-variant text-[10px]">{row[0]}</div>
                  <div className="font-mono-spec text-mono-spec font-bold text-on-surface mt-1">{row[1]}</div>
                  <span className="text-[10px] text-on-surface-variant font-mono-spec">{row[2]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
          <div className="lg:col-span-7 flex flex-col border-2 border-on-surface bg-surface-container-lowest shadow-[3px_3px_0px_#1c1b1b]">
            <div className="w-full border-b border-on-surface bg-surface-container px-space-md py-space-xs flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <span className="font-headline-md text-mono-index text-primary font-bold">[01]</span>
                <span className="font-headline-md text-headline-md uppercase font-bold text-on-surface">SPECIFICATIONS</span>
              </div>
            </div>
            <div className="p-space-md flex flex-col divide-y divide-on-surface/20">
              {[
                ["Cover Transaction Identifier", cover.id],
                ["Parametric Model", cover.template],
                ["Underlying Product Key", cover.product_key],
                ["Cover Beneficiary (Buyer)", cover.buyer],
                ["Base Locked Premium", formatGen(cover.premium)],
                ["Class Multipliers Available", "Class I: 3.0x | Class II: 2.0x | Class III or none: NOHIT"],
              ].map(([k, v]) => (
                <div key={k} className="py-2 flex justify-between items-center gap-space-sm">
                  <span className="font-body-md text-body-md text-on-surface-variant font-medium">{k}</span>
                  <span className="font-mono-spec text-mono-spec font-bold text-on-surface break-all text-right">{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-5 flex flex-col border-2 border-on-surface bg-secondary text-on-secondary shadow-[3px_3px_0px_#1c1b1b]">
            <div className="w-full border-b border-surface-container-low px-space-md py-space-xs font-mono-spec text-mono-spec text-tertiary-fixed font-bold uppercase">
              HARDWARE TELEMETRY RIG
            </div>
            <div className="p-space-md font-mono-spec text-mono-spec">
              <div>STATUS {cover.status}</div>
              <div>PAYOUT {formatGen(cover.payout)}</div>
              <div>REFUND {formatGen(cover.refund)}</div>
            </div>
          </div>
        </div>

        <div className="w-full border-2 border-on-surface bg-surface-container-lowest shadow-[4px_4px_0px_#1c1b1b]">
          <div className="w-full border-b-2 border-on-surface bg-surface-container px-space-md py-space-xs flex flex-wrap items-center justify-between gap-space-sm">
            <div className="flex items-center gap-space-xs">
              <span className="font-headline-md text-mono-index text-primary font-bold">[02]</span>
              <span className="font-headline-md text-headline-md uppercase font-bold text-on-surface">
                OFFICIAL FDA FEED QUERY & VERIFICATION
              </span>
            </div>
            <div className="flex items-center gap-space-xs bg-tertiary text-on-tertiary px-space-sm py-0.5 font-mono-spec text-label-caps font-bold">
              HOST: api.fda.gov
            </div>
          </div>
          <div className="p-space-md lg:p-space-lg flex flex-col gap-space-md">
            <div className="flex items-center justify-between font-mono-spec text-label-caps text-on-surface-variant font-bold">
              <span>DETERMINISTIC HTTP GET QUERY CONSTRUCTED BY CONTRACT</span>
            </div>
            <div className="bg-surface-container-high border border-on-surface p-space-sm font-mono-spec text-mono-spec text-on-surface overflow-x-auto select-all break-all">
              <span className="text-primary font-bold">GET</span> {cover.query_url || "—"}
            </div>
            <div className="border-2 border-on-surface bg-surface-container-low p-space-md font-mono-spec text-mono-spec flex flex-col gap-2">
              <div className="flex justify-between border-b border-on-surface/20 pb-1">
                <span className="text-on-surface-variant">CLASSIFICATION:</span>
                <span className="font-bold text-primary">{matchNeverTrunc.classification || "—"}</span>
              </div>
              <div className="flex justify-between border-b border-on-surface/20 pb-1">
                <span className="text-on-surface-variant">MATCH IDENTIFIER:</span>
                <span className="font-bold text-primary break-all">{matchNeverTrunc.matched_id || "—"}</span>
              </div>
              <div className="flex justify-between border-b border-on-surface/20 pb-1">
                <span className="text-on-surface-variant">MATCH DATE:</span>
                <span className="font-bold">{matchNeverTrunc.match_date || "—"}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-on-surface-variant text-[11px]">OFFICIAL REASON FOR RECALL:</span>
                <span className="font-body-md text-body-sm text-on-surface bg-surface-container-highest p-2 border border-on-surface font-medium whitespace-pre-wrap break-words">
                  {matchNeverTrunc.match_reason || "—"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full border-2 border-on-surface bg-surface-container-lowest shadow-[4px_4px_0px_#1c1b1b]">
          <div className="w-full border-b-2 border-on-surface bg-surface-container px-space-md py-space-xs flex items-center justify-between">
            <div className="flex items-center gap-space-xs">
              <span className="font-headline-md text-mono-index text-primary font-bold">[04]</span>
              <span className="font-headline-md text-headline-md uppercase font-bold text-on-surface">
                EXECUTION CONTROLS
              </span>
            </div>
          </div>
          <div className="p-space-md lg:p-space-lg flex flex-col lg:flex-row items-stretch gap-space-lg">
            <div className="lg:w-2/3 flex flex-col justify-between border-2 border-on-surface bg-surface-container-low p-space-md">
              <p className="font-body-md text-body-md text-on-surface-variant">
                Anyone with a connected Web3 wallet on Chain 61997 can invoke settle after window_end and before expire_at.
              </p>
              {!terminal && showSettle ? (
                <button
                  className="group bg-primary text-on-primary hover:bg-primary-container active:translate-x-0.5 active:translate-y-0.5 transition-all border-2 border-on-surface px-space-lg py-3 flex items-center gap-space-sm shadow-[3px_3px_0px_#1c1b1b] mt-space-md"
                  type="button"
                  onClick={() => setModal("settle")}
                >
                  <span className="font-label-caps text-headline-md uppercase tracking-wider font-bold">
                    EXECUTE SETTLE (PERMISSIONLESS CALL)
                  </span>
                  <span className="bg-on-surface text-surface w-6 h-6 flex items-center justify-center font-bold">→</span>
                </button>
              ) : (
                <span className="font-mono-spec text-mono-spec text-on-surface-variant mt-space-md">
                  SETTLE {terminal ? "HIDDEN (TERMINAL)" : "NOT RIPE"}
                </span>
              )}
              {!terminal && showExpire ? (
                <button
                  type="button"
                  className="mt-space-sm border-2 border-on-surface px-space-md py-2 font-mono-spec text-mono-spec font-bold uppercase"
                  onClick={() => void run("expire")}
                >
                  {busy ? "SIGNING…" : "EXPIRE COVER"}
                </button>
              ) : null}
            </div>
            <div className="lg:w-1/3 flex flex-col justify-between border-2 border-on-surface bg-surface-container-high p-space-md">
              <div>
                <div className="flex items-center justify-between border-b border-on-surface pb-space-xs mb-space-xs">
                  <span className="font-label-caps text-label-caps uppercase font-bold text-on-surface">
                    CANCEL / REFUND MODULE
                  </span>
                  <span className={`font-mono-spec text-[10px] px-1 font-bold ${showCancel ? "bg-tertiary text-on-tertiary" : "bg-error text-on-error"}`}>
                    {showCancel ? "OPEN" : "LOCKED"}
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">
                  Buyer cancellations are strictly permissible prior to window_start ({formatUtc(cover.window_start_utc)}).
                </p>
              </div>
              <div className="mt-space-md">
                {showCancel && !terminal ? (
                  <button
                    className="w-full bg-primary text-on-primary border border-on-surface px-space-md py-2 font-mono-spec text-mono-spec uppercase font-bold"
                    type="button"
                    onClick={() => setModal("cancel")}
                  >
                    CANCEL COVER & REFUND PREMIUM
                  </button>
                ) : (
                  <button
                    className="w-full bg-surface-container border border-on-surface/40 text-on-surface-variant/40 px-space-md py-2 font-mono-spec text-mono-spec uppercase font-bold line-through cursor-not-allowed"
                    disabled
                    type="button"
                  >
                    CANCEL COVER & REFUND PREMIUM
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {cover.status.toUpperCase() === "INSUFFICIENT" ? (
          <button
            type="button"
            className="border-2 border-primary px-space-md py-space-sm font-mono-spec text-mono-spec font-bold uppercase text-primary"
            onClick={() => setModal("insufficient")}
          >
            OPEN INSUFFICIENT FEED TERMINAL
          </button>
        ) : null}

        <ReceiptPanel receipt={receipt} />
        {txErr ? <div className="font-mono-spec text-mono-spec text-error">{txErr}</div> : null}
      </div>

      {modal === "settle" ? (
        <SettleModal
          cover={cover}
          busy={busy}
          error={txErr}
          onClose={() => setModal(null)}
          onConfirm={() => void run("settle")}
        />
      ) : null}
      {modal === "cancel" ? (
        <CancelModal
          cover={cover}
          busy={busy}
          phase={phase}
          error={txErr}
          onClose={() => setModal(null)}
          onConfirm={() => void run("cancel")}
        />
      ) : null}
      {modal === "insufficient" ? <InsufficientModal cover={cover} onClose={() => setModal(null)} /> : null}
    </div>
  );
}
