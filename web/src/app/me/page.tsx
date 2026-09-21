"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { get_cover, get_credit, list_ids, type CoverRecord } from "@/lib/contract";
import { formatGen, formatUtc, statusLabel, truncateAddress } from "@/lib/format";
import { missingDeployAddress } from "@/lib/network";
import { useWallet } from "@/lib/WalletContext";
import { ReceiptPanel } from "@/components/ReceiptPanel";
import { StatusBadge } from "@/components/StatusBadge";

export default function MePage() {
  const w = useWallet();
  const [tab, setTab] = useState<"open" | "settled" | "credits">("open");
  const [covers, setCovers] = useState<CoverRecord[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [credit, setCredit] = useState(0n);

  useEffect(() => {
    const addr = w.address;
    if (!addr || missingDeployAddress()) return;
    let live = true;
    (async () => {
      try {
        const ids = await list_ids();
        const mine: CoverRecord[] = [];
        for (const id of ids) {
          try {
            const c = await get_cover(id);
            if (c.buyer.toLowerCase() === addr.toLowerCase()) mine.push(c);
          } catch {
            /* skip */
          }
        }
        const bal = await get_credit(addr);
        if (live) {
          setCovers(mine);
          setCredit(bal);
        }
        await w.refresh();
      } catch (e) {
        if (live) setErr(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      live = false;
    };
  }, [w.address]);

  const open = covers.filter((c) => c.status.toUpperCase() === "OPEN");
  const settled = covers.filter((c) => c.status.toUpperCase() !== "OPEN");

  const tabCls = (id: typeof tab) =>
    tab === id
      ? "tab-trigger px-space-sm py-2 font-mono-spec text-mono-spec uppercase font-bold border-r border-on-surface bg-on-surface text-surface"
      : "tab-trigger px-space-sm py-2 font-mono-spec text-mono-spec uppercase font-bold border-r border-on-surface text-on-surface hover:bg-surface-container";

  return (
    <div className="flex flex-col w-full">
      <div className="max-w-[1360px] w-full mx-auto px-margin md:px-margin-desktop py-space-lg flex flex-col gap-space-xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b-2 border-on-surface pb-space-sm gap-space-md">
          <div>
            <span className="bg-primary text-on-primary font-mono-spec text-mono-spec px-space-xs py-0.5 font-bold uppercase">
              [HARDWARE RACK 04]
            </span>
            <h1 className="font-display-hero text-headline-xl tracking-tighter uppercase font-bold text-on-surface leading-none mt-space-xs">
              MY<span className="text-primary">.COV</span>
            </h1>
          </div>
        </div>

        <div className="flex flex-col gap-space-md mt-space-md">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b-2 border-on-surface pb-space-sm gap-space-md">
            <div className="flex items-center gap-space-sm">
              <span className="font-headline-md text-headline-md font-bold text-primary">[02]</span>
              <h2 className="font-headline-md text-headline-md font-bold uppercase text-on-surface">
                CONNECTED WALLET MANAGEMENT
              </h2>
            </div>
            <div className="flex flex-wrap items-center border border-on-surface bg-surface-container-lowest shadow-[2px_2px_0px_#1c1b1b]">
              <button type="button" className={tabCls("open")} onClick={() => setTab("open")}>
                [01] OPEN COVERS ({open.length})
              </button>
              <button type="button" className={tabCls("settled")} onClick={() => setTab("settled")}>
                [02] SETTLED COVERS ({settled.length})
              </button>
              <button type="button" className={tabCls("credits")} onClick={() => setTab("credits")}>
                [03] CREDITS & WITHDRAW
              </button>
            </div>
          </div>

          {!w.address ? (
            <div className="border-2 border-on-surface p-space-lg font-mono-spec text-mono-spec">CONNECT WALLET TO LOAD MY COVERS</div>
          ) : null}
          {err ? <div className="font-mono-spec text-mono-spec text-error">{err}</div> : null}

          {tab === "open" ? (
            <div className="flex flex-col gap-space-md">
              {open.length === 0 ? (
                <div className="border-2 border-on-surface p-space-md font-mono-spec text-mono-spec">NO OPEN COVERS</div>
              ) : null}
              {open.map((c) => (
                <div
                  key={c.id}
                  className="border-2 border-on-surface bg-surface-container-lowest p-space-md md:p-space-lg flex flex-col gap-space-md shadow-[3px_3px_0px_#1c1b1b]"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-on-surface pb-space-sm gap-space-xs">
                    <div className="flex items-center gap-space-sm">
                      <span className="bg-tertiary text-on-tertiary font-mono-spec text-mono-spec px-1.5 font-bold uppercase">
                        STATUS: {statusLabel(c.status).toUpperCase()}
                      </span>
                      <span className="font-mono-spec text-mono-spec font-bold text-on-surface">
                        COVER ID: {truncateAddress(c.id, 6)}
                      </span>
                    </div>
                    <span className="font-mono-spec text-mono-spec text-on-surface-variant font-bold">
                      CREATED: {formatUtc(c.created_at)} // EXPIRES: {formatUtc(c.expire_at_utc)}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-space-md">
                    <div className="flex flex-col">
                      <span className="font-label-caps text-label-caps uppercase text-on-surface-variant font-bold">
                        TARGET ENTITY
                      </span>
                      <span className="font-headline-md text-headline-md font-bold text-on-surface tracking-tight">
                        {c.product_key}
                      </span>
                      <span className="font-mono-spec text-mono-spec text-on-surface-variant">{c.template}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-label-caps text-label-caps uppercase text-on-surface-variant font-bold">
                        PREMIUM / RESERVE
                      </span>
                      <span className="font-mono-index text-headline-md font-bold">
                        {formatGen(c.premium, { suffix: false })} / {formatGen(c.reserve, { suffix: false })}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-label-caps text-label-caps uppercase text-on-surface-variant font-bold">
                        WINDOW
                      </span>
                      <span className="font-mono-spec text-mono-spec">
                        {formatUtc(c.window_start_utc)} → {formatUtc(c.window_end_utc)}
                      </span>
                    </div>
                    <div className="flex items-end">
                      <Link
                        href={`/cover/${encodeURIComponent(c.id)}`}
                        className="border border-on-surface bg-surface-container hover:bg-surface-container-high px-space-md py-2 font-mono-spec text-mono-spec uppercase font-bold"
                      >
                        [VIEW COVER]
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {tab === "settled" ? (
            <div className="flex flex-col gap-space-md">
              {settled.length === 0 ? (
                <div className="border-2 border-on-surface p-space-md font-mono-spec text-mono-spec">NO SETTLED COVERS</div>
              ) : null}
              {settled.map((c) => (
                <div
                  key={c.id}
                  className="border-2 border-on-surface bg-surface-container-lowest p-space-md flex flex-col gap-space-sm border-l-8 border-l-primary shadow-[2px_2px_0px_#1c1b1b]"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs border-b border-on-surface/20 pb-space-xs">
                    <div className="flex items-center gap-space-sm">
                      <StatusBadge status={c.status} extra={c.classification || undefined} />
                      <span className="font-mono-spec text-mono-spec font-bold text-on-surface">
                        COVER {truncateAddress(c.id, 6)}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-space-sm font-mono-spec text-mono-spec">
                    <div>
                      <span className="text-on-surface-variant block text-label-caps font-bold">PRODUCT</span>
                      <span className="font-bold text-on-surface text-body-md">{c.product_key}</span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant block text-label-caps font-bold">MATCH</span>
                      <span className="font-bold text-primary break-all">{c.matched_id || c.match_reason || "—"}</span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant block text-label-caps font-bold">PREMIUM</span>
                      <span className="text-on-surface">{formatGen(c.premium)}</span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant block text-label-caps font-bold">PAYOUT / REFUND</span>
                      <span className="font-bold text-primary text-body-md">
                        {formatGen(c.payout)} / {formatGen(c.refund)}
                      </span>
                    </div>
                  </div>
                  <Link href={`/cover/${encodeURIComponent(c.id)}`} className="font-mono-spec text-mono-spec underline">
                    RECEIPT ↗
                  </Link>
                </div>
              ))}
            </div>
          ) : null}

          {tab === "credits" ? (
            <div className="flex flex-col gap-space-md">
              <div className="border-2 border-on-surface bg-surface-container-lowest p-space-md md:p-space-lg flex flex-col md:flex-row md:items-center justify-between gap-space-lg shadow-[4px_4px_0px_#1c1b1b]">
                <div className="flex flex-col gap-space-xs">
                  <span className="font-label-caps text-label-caps uppercase text-on-surface-variant font-bold">
                    PROTOCOL CREDIT
                  </span>
                  <div className="font-mono-index text-display-hero font-bold tracking-tighter text-on-surface leading-none">
                    {formatGen(credit > 0n ? credit : w.credits, { suffix: false })}{" "}
                    <span className="text-headline-md font-normal text-on-surface-variant">tGEN</span>
                  </div>
                </div>
                <div className="flex flex-col gap-space-sm w-full md:w-auto shrink-0">
                  <button
                    className="bg-primary text-on-primary hover:bg-primary-hover border-2 border-on-surface px-space-lg py-4 font-headline-md text-headline-md uppercase font-bold tracking-tight disabled:opacity-50"
                    type="button"
                    disabled={credit <= 0n || msg === "Withdrawing…"}
                    onClick={async () => {
                      setMsg("Withdrawing…");
                      try {
                        await w.doWithdraw();
                        const bal = await import("@/lib/contract").then(m => m.get_credit(w.address!));
                        setCredit(bal);
                        setMsg("Withdraw submitted — check your wallet balance.");
                      } catch (e) {
                        setMsg(`Withdraw failed: ${e instanceof Error ? e.message : String(e)}`);
                      }
                    }}
                    title="Withdraw credits to your wallet"
                  >
                    WITHDRAW
                  </button>
                  <span className="font-mono-spec text-mono-spec text-center text-on-surface-variant font-bold">
                    CREDIT HELD FOR {truncateAddress(w.address)}
                  </span>
                </div>
              </div>
            </div>
          ) : null}
          {msg ? <div className="font-mono-spec text-mono-spec">{msg}</div> : null}
          <ReceiptPanel receipt={null} />
        </div>
      </div>
    </div>
  );
}
