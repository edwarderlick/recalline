"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { get_cover, get_economics, list_ids, type CoverRecord, type Economics } from "@/lib/contract";
import { canSettle } from "@/lib/coverState";
import { formatGen, formatUtc, statusLabel, truncateAddress } from "@/lib/format";
import { withTimeout } from "@/lib/genlayer";
import { CONTRACT_ADDRESS, missingDeployAddress } from "@/lib/network";
import { StatusBadge } from "@/components/StatusBadge";

type Filter =
  | "all"
  | "open-ripe"
  | "open-unripe"
  | "hit"
  | "nohit"
  | "insufficient"
  | "canceled"
  | "expired";

function matches(c: CoverRecord, f: Filter, now: Date): boolean {
  const s = c.status.toUpperCase();
  if (f === "all") return true;
  if (f === "open-ripe") return s === "OPEN" && canSettle(c, now);
  if (f === "open-unripe") return s === "OPEN" && !canSettle(c, now);
  return s === f.toUpperCase();
}

export default function BrowsePage() {
  const [covers, setCovers] = useState<CoverRecord[]>([]);
  const [eco, setEco] = useState<Economics | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const now = useMemo(() => new Date(), [covers.length]);

  useEffect(() => {
    if (missingDeployAddress()) {
      setErr("deploy address missing");
      setLoading(false);
      return;
    }
    let live = true;
    (async () => {
      try {
        const [ids, e] = await withTimeout(
          Promise.all([list_ids(), get_economics()]),
          15_000,
          "list_ids/get_economics",
        );
        const rows: CoverRecord[] = [];
        for (const id of ids) {
          try {
            rows.push(await get_cover(id));
          } catch {
            /* skip unknown */
          }
        }
        if (!live) return;
        setCovers(rows);
        setEco(e);
      } catch (e) {
        if (live) setErr(e instanceof Error ? e.message : String(e));
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  const counts = useMemo(() => {
    const n = (f: Filter) => covers.filter((c) => matches(c, f, now)).length;
    return {
      all: covers.length,
      ripe: n("open-ripe"),
      unripe: n("open-unripe"),
      hit: n("hit"),
      nohit: n("nohit"),
      insufficient: n("insufficient"),
      canceled: n("canceled"),
      expired: n("expired"),
    };
  }, [covers, now]);

  const shown = covers.filter((c) => matches(c, filter, now));
  const ripeHero = covers.find((c) => canSettle(c, now));

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: `[ALL: ${counts.all}]` },
    { id: "open-ripe", label: `[OPEN (RIPE: ${counts.ripe})]` },
    { id: "open-unripe", label: `[OPEN (UNRIPE: ${counts.unripe})]` },
    { id: "hit", label: `[HIT: ${counts.hit}]` },
    { id: "nohit", label: `[NOHIT: ${counts.nohit}]` },
    { id: "insufficient", label: `[INSUFFICIENT: ${counts.insufficient}]` },
    { id: "canceled", label: `[CANCELED: ${counts.canceled}]` },
    { id: "expired", label: `[EXPIRED: ${counts.expired}]` },
  ];

  return (
    <div className="flex flex-col w-full">
      <section className="w-full bg-surface-container-high px-space-md lg:px-space-lg py-space-sm border-b-2 border-on-surface">
        <div className="max-w-[1360px] mx-auto flex flex-col xl:flex-row items-start xl:items-center justify-between gap-space-md">
          <div className="flex flex-wrap items-center gap-space-sm">
            <div className="bg-on-surface text-surface px-space-xs py-0.5 font-mono-spec text-mono-spec font-bold uppercase tracking-wider">
              MARKET REGISTRY v2.4
            </div>
            <div className="flex items-center gap-space-xs bg-surface-container-lowest px-space-sm py-1 border border-on-surface">
              <span className="font-mono-spec text-mono-spec text-on-surface-variant uppercase">ACTIVE COVERS:</span>
              <span className="font-mono-index text-mono-index text-on-surface font-bold">{counts.all}</span>
            </div>
            <div className="flex items-center gap-space-xs bg-primary text-on-primary px-space-sm py-1 border border-on-surface shadow-[2px_2px_0px_#1c1b1b]">
              <span className="h-2 w-2 rounded-full bg-surface animate-ping" />
              <span className="font-mono-spec text-mono-spec uppercase font-bold tracking-tight">RIPE FOR SETTLE:</span>
              <span className="font-mono-index text-mono-index font-bold text-on-primary">
                {String(counts.ripe).padStart(2, "0")}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-space-xs sm:gap-space-sm font-mono-spec text-mono-spec">
            <div className="bg-surface-container-lowest px-space-sm py-1 border border-on-surface">
              <span className="text-on-surface-variant">TOTAL POOL:</span>
              <span className="font-bold text-on-surface ml-1">{eco ? formatGen(eco.pool_deposited) : "—"}</span>
            </div>
            <div className="bg-surface-container-lowest px-space-sm py-1 border border-on-surface">
              <span className="text-on-surface-variant">RESERVED EXPOSURE:</span>
              <span className="font-bold text-primary ml-1">{eco ? formatGen(eco.pool_reserved) : "—"}</span>
            </div>
            <div className="bg-secondary-container px-space-sm py-1 border border-on-surface text-on-secondary-container font-bold">
              <span>AVAILABLE:</span>
              <span className="text-tertiary ml-1">{eco ? formatGen(eco.pool_available) : "—"}</span>
            </div>
            <div className="bg-surface-container-lowest px-space-sm py-1 border border-on-surface">
              <span className="text-on-surface-variant">OUTSTANDING CREDITS:</span>
              <span className="font-bold text-on-surface ml-1">{eco ? formatGen(eco.credits_outstanding) : "—"}</span>
            </div>
          </div>
        </div>
      </section>

      <div className="w-full max-w-[1360px] mx-auto px-space-md lg:px-space-lg py-space-lg flex flex-col gap-space-lg">
        <div className="w-full bg-surface-container-low border-2 border-on-surface shadow-[4px_4px_0px_#1c1b1b] p-space-md flex flex-col gap-space-md">
          <div className="flex flex-wrap items-center justify-between border-b border-on-surface pb-space-xs gap-space-sm">
            <div className="flex items-center gap-space-xs font-mono-spec text-mono-spec uppercase font-bold text-on-surface">
              <span className="bg-primary text-on-primary px-space-xs py-0.5">[01]</span>
              <span>FILTER PARAMETERS // DETERMINISTIC RESOLUTION STATE</span>
            </div>
            <div className="font-mono-spec text-mono-spec text-on-surface-variant tracking-wider uppercase">
              ORACLE FEED: openFDA v2.0 JSON
            </div>
          </div>
          <div className="flex flex-col gap-space-xs">
            <span className="font-label-caps text-label-caps uppercase text-on-surface-variant font-bold">
              PROTOCOL EXECUTION STATE:
            </span>
            <div className="flex flex-wrap gap-1.5 sm:gap-2 text-mono-spec font-mono-spec">
              {filters.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={
                    filter === f.id
                      ? "bg-on-surface text-surface border border-on-surface px-space-sm py-1 font-bold shadow-[2px_2px_0px_#1c1b1b]"
                      : "bg-surface-container-lowest text-on-surface border border-on-surface px-space-sm py-1 font-bold hover:bg-surface-container-high"
                  }
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="border-2 border-on-surface p-space-lg font-mono-spec text-mono-spec">LOADING list_ids + get_cover…</div>
        ) : err ? (
          <div className="border-2 border-error p-space-lg font-mono-spec text-mono-spec text-error">{err}</div>
        ) : missingDeployAddress() ? (
          <div className="border-2 border-on-surface p-space-lg font-mono-spec text-mono-spec">deploy address missing</div>
        ) : shown.length === 0 ? (
          <div className="border-2 border-on-surface p-space-lg font-mono-spec text-mono-spec">
            NO COVERS ON CHAIN. Buy cover or fund pool first.
          </div>
        ) : null}

        {ripeHero ? (
          <div className="w-full bg-surface-container-lowest border-2 border-primary shadow-[6px_6px_0px_#af2900] overflow-hidden relative">
            <div className="w-full bg-primary text-on-primary px-space-md py-space-xs flex flex-wrap items-center justify-between gap-space-sm border-b-2 border-primary">
              <span className="font-mono-spec text-mono-spec font-bold uppercase tracking-wider">
                ★ IMMEDIATE ACTION REQUIRED: RIPE FOR SETTLE (CALLABLE BY ANY WALLET)
              </span>
            </div>
            <div className="p-space-md lg:p-space-lg flex flex-col xl:flex-row items-start xl:items-center justify-between gap-space-lg">
              <div className="flex flex-col gap-space-sm max-w-2xl">
                <div className="flex flex-wrap items-center gap-space-sm">
                  <span className="bg-primary text-on-primary font-mono-spec text-mono-spec px-space-xs py-0.5 font-bold uppercase">
                    COVER #{truncateAddress(ripeHero.id, 6)}
                  </span>
                  <span className="border border-on-surface bg-secondary-container text-on-secondary-container font-mono-spec text-mono-spec px-space-xs py-0.5 font-bold">
                    [{ripeHero.template}]
                  </span>
                </div>
                <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface uppercase tracking-tight">
                  {ripeHero.product_key}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-space-sm pt-space-xs font-mono-spec text-mono-spec">
                  <div className="flex flex-col border border-on-surface bg-surface-container-lowest p-space-xs">
                    <span className="text-on-surface-variant text-[11px] uppercase">OBSERVATION WINDOW</span>
                    <span className="font-bold text-on-surface">{formatUtc(ripeHero.window_start_utc)}</span>
                    <span className="text-primary font-bold">→ {formatUtc(ripeHero.window_end_utc)}</span>
                  </div>
                  <div className="flex flex-col border border-on-surface bg-surface-container-lowest p-space-xs">
                    <span className="text-on-surface-variant text-[11px] uppercase">SETTLEMENT TIMELOCK</span>
                    <span className="font-bold text-tertiary">WITHIN 7-DAY GRACE PERIOD</span>
                    <span className="text-on-surface text-[11px]">Expires: {formatUtc(ripeHero.expire_at_utc)}</span>
                  </div>
                </div>
              </div>
              <div className="w-full xl:w-auto flex flex-col gap-space-md min-w-[320px] bg-surface-container-lowest p-space-md border-2 border-on-surface shadow-[4px_4px_0px_#1c1b1b]">
                <div className="flex justify-between items-center border-b border-on-surface pb-space-xs">
                  <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">PREMIUM POOL DEPOSIT</span>
                  <span className="font-mono-index text-mono-index text-on-surface font-bold">{formatGen(ripeHero.premium)}</span>
                </div>
                <Link
                  href={`/cover/${encodeURIComponent(ripeHero.id)}`}
                  className="w-full bg-primary hover:bg-primary-container text-on-primary font-headline-md text-[18px] uppercase tracking-wider py-space-sm px-space-md border-2 border-on-surface shadow-[4px_4px_0px_#1c1b1b] flex items-center justify-between"
                >
                  <span className="font-bold">CALL SETTLE NOW</span>
                  <span className="bg-on-surface text-surface px-space-xs py-0.5 text-mono-spec font-mono-spec font-bold">→ EXECUTE</span>
                </Link>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap items-end justify-between border-b-2 border-on-surface pb-space-xs pt-space-md">
          <span className="font-headline-md text-headline-md uppercase font-bold text-on-surface">
            [02] CONTRACT INSTANCES LEDGER
          </span>
          <div className="font-mono-spec text-mono-spec text-on-surface-variant uppercase">
            SHOWING {shown.length} LIVE TELEMETRY UNITS
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-space-md">
          {shown.map((c) => (
            <div
              key={c.id}
              className="bg-surface-container-lowest border-2 border-on-surface p-space-md flex flex-col justify-between shadow-[4px_4px_0px_#1c1b1b] relative group hover:-translate-y-0.5 transition-transform"
            >
              <div className="flex flex-col gap-space-sm">
                <div className="flex items-center justify-between border-b border-on-surface pb-space-xs">
                  <span className="font-mono-spec text-mono-spec font-bold text-on-surface">
                    ID: {truncateAddress(c.id, 4)}
                  </span>
                  <StatusBadge status={c.status} extra={c.classification || undefined} />
                </div>
                <div className="flex flex-col">
                  <span className="font-label-caps text-label-caps text-primary uppercase font-bold">{c.template}</span>
                  <h3 className="font-headline-md text-[20px] font-bold text-on-surface uppercase tracking-tight">
                    {c.product_key}
                  </h3>
                </div>
                <div className="bg-surface-container border border-on-surface p-space-xs flex flex-col gap-1 font-mono-spec text-mono-spec">
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">PREMIUM:</span>
                    <span className="font-bold text-on-surface">{formatGen(c.premium)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">STATUS:</span>
                    <span className="font-bold">{statusLabel(c.status)}</span>
                  </div>
                  <div className="flex justify-between border-t border-dashed border-outline-variant pt-1">
                    <span className="text-on-surface-variant">WINDOW END:</span>
                    <span className="text-on-surface font-bold">{formatUtc(c.window_end_utc)}</span>
                  </div>
                </div>
              </div>
              <div className="mt-space-md pt-space-xs border-t border-on-surface flex items-center justify-between">
                <span className="font-mono-spec text-mono-spec text-on-surface-variant uppercase">
                  {canSettle(c, now) ? "WINDOW RIPE" : statusLabel(c.status).toUpperCase()}
                </span>
                <Link
                  href={`/cover/${encodeURIComponent(c.id)}`}
                  className="bg-surface-container-high hover:bg-on-surface hover:text-surface text-on-surface border border-on-surface font-mono-spec text-mono-spec font-bold px-space-sm py-1 transition-colors"
                >
                  DETAILS →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
