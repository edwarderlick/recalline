"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { formatGen, truncateAddress } from "@/lib/format";
import { CHAIN_ID, missingDeployAddress } from "@/lib/network";
import { useWallet } from "@/lib/WalletContext";

const NAV = [
  { href: "/buy", label: "Buy Cover", match: ["/buy"] },
  { href: "/browse", label: "Browse", match: ["/browse", "/cover"] },
  { href: "/me", label: "My Covers", match: ["/me"] },
  { href: "/pool", label: "Pool", match: ["/pool"] },
  { href: "/how", label: "How RecallLine Works", match: ["/how"] },
];

function HardwareGlyph() {
  return (
    <div
      aria-hidden
      className="w-8 h-8 border border-on-surface bg-on-surface text-surface flex items-center justify-center"
      title="Chassis glyph"
    >
      <svg viewBox="0 0 32 32" className="w-6 h-6" fill="none">
        <rect x="2" y="2" width="28" height="28" fill="#af2900" />
        <path
          d="M6 16H10L13 8L17 24L21 12L24 20L26 16H28"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="square"
        />
      </svg>
    </div>
  );
}

export function Chrome({ children }: { children: React.ReactNode }) {
  const path = usePathname() || "/";
  const w = useWallet();
  const [picker, setPicker] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const wrong =
    Boolean(w.address) && w.chainId != null && w.chainId !== CHAIN_ID;

  async function onConnect() {
    try {
      const c = await w.connect();
      if (!c.address) setPicker(true);
    } catch {
      setPicker(true);
    }
  }

  async function onWithdraw() {
    setBusy(true);
    setMsg(null);
    try {
      await w.doWithdraw();
      setMsg("withdraw accepted");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-background font-body-md text-on-surface antialiased selection:bg-primary-container selection:text-on-primary-container min-h-screen">
      <div className="fixed top-0 left-0 right-0 z-50 bg-surface-container-lowest">
        {wrong ? (
          <div className="w-full bg-primary-container text-on-primary-container px-space-md py-space-xs flex items-center justify-between border-b border-on-surface">
            <div className="flex items-center gap-space-sm font-mono-spec text-mono-spec tracking-wider uppercase">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-surface opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-surface" />
              </span>
              <span className="font-bold">PARAMETRIC ENGINE PROTOCOL</span>
              <span className="opacity-70">//</span>
              <span>CHAIN ID: 61997</span>
              <span className="opacity-70">//</span>
              <span className="hidden md:inline">RPC: STUDIO-DEV.GENLAYER.COM/API</span>
            </div>
            <div className="flex items-center gap-space-sm font-mono-spec text-mono-spec">
              <span className="hidden sm:inline opacity-90">[NETWORK MISMATCH HAZARD MITIGATION]</span>
              <button
                className="bg-on-surface text-surface hover:bg-surface hover:text-on-surface transition-colors px-space-sm py-0.5 border border-on-surface text-mono-spec uppercase font-bold tracking-tight"
                type="button"
                onClick={() => void w.switchNetwork()}
              >
                SWITCH TO 61997
              </button>
            </div>
          </div>
        ) : null}
        <header className="h-16 w-full border-b border-on-surface bg-surface-container-lowest px-space-md flex items-center justify-between gap-space-md">
          <div className="flex items-center gap-space-md">
            <Link href="/" className="flex items-center gap-space-sm">
              <div className="bg-on-surface text-surface px-space-xs py-0.5 font-mono-spec text-mono-spec font-bold">
                RL-01
              </div>
              <span className="font-headline-md text-headline-md tracking-tighter uppercase font-bold text-on-surface">
                RECALL<span className="text-primary">LINE</span>
              </span>
            </Link>
            <div className="hidden xl:flex items-center gap-space-xs border border-on-surface px-space-xs py-0.5 bg-secondary-container text-on-secondary-container">
              <span className="h-1.5 w-1.5 rounded-full bg-tertiary" />
              <span className="font-mono-spec text-mono-spec uppercase font-bold">
                [01] NET: GENLAYER STUDIO NEXT (61997)
              </span>
            </div>
          </div>
          <nav className="hidden lg:flex items-center border border-on-surface">
            {NAV.map((n, i) => {
              const active = n.match.some((m) => path === m || path.startsWith(m + "/"));
              const last = i === NAV.length - 1;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={active ? "page" : undefined}
                  className={
                    active
                      ? `uppercase px-space-md py-2 ${last ? "" : "border-r border-on-surface"} transition-colors bg-on-surface text-surface font-bold`
                      : `font-label-caps text-label-caps uppercase px-space-md py-2 ${last ? "" : "border-r border-on-surface"} text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors`
                  }
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-space-sm">
            {w.address ? (
              <div className="flex items-center border border-on-surface bg-surface-container">
                <button
                  type="button"
                  onClick={() => setPicker(true)}
                  className="flex items-center"
                  title="Change wallet"
                >
                  <div className="px-space-sm py-1 border-r border-on-surface font-mono-spec text-mono-spec font-bold text-on-surface">
                    {truncateAddress(w.address)}
                  </div>
                  <div className="hidden sm:block px-space-sm py-1 bg-surface-container-highest font-mono-spec text-mono-spec text-tertiary font-bold">
                    {formatGen(w.balanceWei)}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    w.disconnect();
                    setPicker(false);
                    setMsg(null);
                  }}
                  className="px-space-sm py-1 border-l border-on-surface font-mono-spec text-mono-spec font-bold uppercase text-primary hover:bg-primary hover:text-on-primary"
                  title="Disconnect wallet"
                >
                  DISCONNECT
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => void onConnect()}
                className="flex items-center border border-on-surface bg-primary text-on-primary px-space-sm py-1 font-mono-spec text-mono-spec font-bold uppercase shrink-0"
              >
                {w.connecting ? "CONNECTING…" : "CONNECT WALLET"}
              </button>
            )}
            <div className="flex items-center border border-on-surface bg-surface-container-low px-space-sm py-1">
              <span className="font-mono-spec text-mono-spec text-on-surface font-bold mr-space-xs">
                [CREDITS: {formatGen(w.credits)}]
              </span>
              <button
                className="font-label-caps text-label-caps text-primary hover:text-on-surface underline uppercase font-bold disabled:opacity-40"
                type="button"
                disabled={!w.address || w.credits === 0n || busy}
                onClick={() => void onWithdraw()}
              >
                Withdraw
              </button>
            </div>
            <div className="flex items-center pl-space-xs border-l border-on-surface">
              <HardwareGlyph />
            </div>
          </div>
        </header>
        {missingDeployAddress() ? (
          <div className="w-full bg-error-container text-on-error-container px-space-md py-space-xs font-mono-spec text-mono-spec font-bold uppercase">
            deploy address missing — set NEXT_PUBLIC_CONTRACT_ADDRESS
          </div>
        ) : null}
        {msg ? (
          <div className="w-full bg-surface-container-high px-space-md py-space-xs font-mono-spec text-mono-spec">
            {msg}
          </div>
        ) : null}
      </div>
      {picker ? (
        <div className="fixed inset-0 z-[60] bg-on-surface/40 flex items-center justify-center p-space-md">
          <div className="bg-surface-container-lowest border-2 border-on-surface shadow-[4px_4px_0px_#1c1b1b] w-full max-w-md">
            <div className="bg-on-surface text-surface px-space-md py-space-sm font-mono-spec text-mono-spec font-bold uppercase flex justify-between">
              <span>SELECT EIP-6963 PROVIDER</span>
              <button type="button" onClick={() => setPicker(false)}>
                ✕
              </button>
            </div>
            <div className="p-space-md flex flex-col gap-space-xs">
              {w.address ? (
                <button
                  type="button"
                  className="border-2 border-on-surface bg-primary text-on-primary px-space-md py-space-sm font-mono-spec text-mono-spec font-bold uppercase"
                  onClick={() => {
                    w.disconnect();
                    setPicker(false);
                  }}
                >
                  DISCONNECT {truncateAddress(w.address)}
                </button>
              ) : null}
              {w.providers.map((p) => (
                <button
                  key={p.info.uuid}
                  type="button"
                  className="border border-on-surface px-space-md py-space-sm text-left font-mono-spec text-mono-spec font-bold uppercase hover:bg-surface-container-high"
                  onClick={() => {
                    void w.connect(p.info.uuid);
                    setPicker(false);
                  }}
                >
                  {p.info.name}
                </button>
              ))}
              {w.providers.length === 0 ? (
                <div className="flex flex-col gap-space-sm font-mono-spec text-mono-spec">
                  <p className="text-on-surface-variant">
                    No injected wallet in this browser. Install an extension or open the site in the wallet’s in-app browser (Chrome, Brave, Edge, Firefox, or the wallet app).
                  </p>
                  <a className="underline font-bold" href="https://metamask.io/download/" target="_blank" rel="noreferrer">
                    MetaMask
                  </a>
                  <a className="underline font-bold" href="https://rabby.io/" target="_blank" rel="noreferrer">
                    Rabby
                  </a>
                  <a className="underline font-bold" href="https://www.coinbase.com/wallet" target="_blank" rel="noreferrer">
                    Coinbase Wallet
                  </a>
                  <button
                    type="button"
                    className="border border-on-surface px-space-md py-space-sm font-bold uppercase"
                    onClick={() => {
                      void w.connect();
                      setPicker(false);
                    }}
                  >
                    RETRY INJECTED window.ethereum
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
      <main className={`w-full ${wrong ? "pt-[104px]" : "pt-16"} bg-background min-h-[calc(100vh-80px)]`}>
        {children}
      </main>
      <footer className="w-full border-t border-on-surface bg-surface-container-low">
        <div className="w-full border-b border-on-surface px-space-md py-space-xs bg-on-surface text-surface font-mono-spec text-mono-spec flex flex-wrap items-center justify-between gap-space-sm">
          <div className="tracking-tight font-bold uppercase truncate">
            RECALLLINE PARAMETRIC ENGINE // STUDIO-DEV // OFFICIAL OPENFDA JSON VERIFICATION // RPC:
            STUDIO-DEV.GENLAYER.COM/API // NO APPEAL // NO JURY
          </div>
          <div className="flex items-center gap-space-md shrink-0 uppercase">
            <span className="text-secondary-container font-bold">EPOCH: #98412</span>
            <span>STABILITY: NOMINAL</span>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-space-md lg:px-space-lg py-space-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-space-md">
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center gap-space-sm">
              <span className="font-headline-md text-headline-md uppercase font-bold text-on-surface">
                RECALLLINE
              </span>
              <span className="bg-primary text-on-primary font-mono-spec text-mono-spec px-space-xs py-0.5 font-bold">
                RL-01
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant max-w-xl">
              Parametric FDA recall cover on GenLayer Studio Next (chain 61997). Deterministic JSON
              match. No court. No jury. No appeal.
            </p>
          </div>
          <div className="font-mono-spec text-mono-spec text-on-surface-variant uppercase">
            CHAIN 61997 // tGEN // api.fda.gov
          </div>
        </div>
      </footer>
    </div>
  );
}
