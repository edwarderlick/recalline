"use client";

import { useEffect, useState } from "react";
import { fund_pool, get_economics, type Economics } from "@/lib/contract";
import { formatGen, parseGenInput } from "@/lib/format";
import { CHAIN_ID, missingDeployAddress } from "@/lib/network";
import { useWallet } from "@/lib/WalletContext";
import { ReceiptPanel } from "@/components/ReceiptPanel";
import type { TxReceipt } from "@/lib/genlayer";

export default function PoolPage() {
  const w = useWallet();
  const [eco, setEco] = useState<Economics | null>(null);
  const [amount, setAmount] = useState("1000");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<TxReceipt | null>(null);

  async function load() {
    if (missingDeployAddress()) return;
    try {
      setEco(await get_economics());
      setErr(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const deposited = eco ? BigInt(String(eco.pool_deposited ?? 0)) : 0n;
  const reserved = eco ? BigInt(String(eco.pool_reserved ?? 0)) : 0n;
  const available = eco ? BigInt(String(eco.pool_available ?? 0)) : 0n;
  const openP = eco ? BigInt(String(eco.open_premiums ?? 0)) : 0n;
  const credits = eco ? BigInt(String(eco.credits_outstanding ?? 0)) : 0n;
  const treasury = eco ? BigInt(String(eco.treasury ?? 0)) : 0n;
  const ratio = deposited > 0n ? Number((reserved * 10000n) / deposited) / 100 : 0;

  async function deposit() {
    setErr(null);
    setReceipt(null);
    let addr = w.address;
    let prov = w.provider;
    if (!addr || !prov) {
      try {
        const c = await w.connect();
        addr = c.address;
        prov = c.provider;
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Connect a wallet first (header CONNECT WALLET).");
        return;
      }
    }
    if (!addr || !prov) {
      setErr("Connect a wallet first. Click CONNECT WALLET in the header, approve the popup, then deposit.");
      return;
    }
    if (w.chainId != null && w.chainId !== CHAIN_ID) {
      try {
        await w.switchNetwork();
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Switch wallet to chain 61997 (Studio Next).");
        return;
      }
    }
    let v: bigint;
    try {
      v = parseGenInput(amount);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "invalid amount");
      return;
    }
    if (v <= 0n) {
      setErr("value > 0");
      return;
    }
    if (w.balanceWei === 0n) {
      setErr("Wallet shows 0 tGEN. Get test GEN from the studio-dev faucet, then deposit. A wallet popup should still open.");
    }
    setBusy(true);
    try {
      const r = await fund_pool(addr as `0x${string}`, prov, v);
      setReceipt(r);
      await load();
      await w.refresh();
      setErr(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col w-full">
      <div className="max-w-[1360px] w-full mx-auto px-margin md:px-margin-desktop py-space-lg flex flex-col gap-space-xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b-2 border-on-surface pb-space-sm gap-space-md">
          <div className="flex flex-col">
            <div className="flex items-center gap-space-sm">
              <span className="bg-primary text-on-primary font-mono-spec text-mono-spec px-space-xs py-0.5 font-bold uppercase tracking-wider">
                [HARDWARE RACK 04]
              </span>
              <span className="font-mono-spec text-mono-spec text-on-surface-variant font-bold">
                GENLAYER CH-61997 / PARAMETRIC POOL CORE
              </span>
            </div>
            <div className="flex items-baseline gap-space-md mt-space-xs">
              <h1 className="font-display-hero text-headline-xl md:text-display-hero tracking-tighter uppercase font-bold text-on-surface leading-none">
                POOL<span className="text-primary">.SYS</span>
              </h1>
              <span className="font-mono-index text-mono-index text-tertiary font-bold tracking-tight uppercase hidden sm:inline">
                // STATUS: 100% DETERMINISTIC
              </span>
            </div>
          </div>
          <div className="flex items-center gap-space-sm bg-surface-container border border-on-surface px-space-sm py-1.5 shadow-[2px_2px_0px_#1c1b1b]">
            <span className="inline-block w-2.5 h-2.5 rounded-none bg-primary animate-pulse" />
            <span className="font-mono-spec text-mono-spec uppercase font-bold text-on-surface">
              OPTIMISTIC EXECUTION ACTIVE
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-space-xs">
          <div className="flex items-center justify-between border-b border-on-surface pb-space-xs">
            <div className="flex items-center gap-space-sm">
              <span className="font-headline-md text-headline-md font-bold text-primary">[01]</span>
              <h2 className="font-headline-md text-headline-md font-bold tracking-tight uppercase text-on-surface">
                Global Pool Economics
              </h2>
            </div>
            <span className="font-mono-spec text-mono-spec text-on-surface-variant uppercase font-bold tracking-widest hidden md:inline">
              CALL: get_economics()
            </span>
          </div>
          {missingDeployAddress() ? (
            <div className="font-mono-spec text-mono-spec">deploy address missing</div>
          ) : null}
          {err ? <div className="font-mono-spec text-mono-spec text-error">{err}</div> : null}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 border-2 border-on-surface bg-surface-container-lowest">
            {[
              ["TOTAL POOL DEPOSITED", "[M-01]", formatGen(deposited), "TOTAL LIQUIDITY STASH"],
              ["POOL RESERVED EXPOSURE", "[M-02]", formatGen(reserved), `${ratio.toFixed(2)}% RATIO`],
              ["POOL AVAILABLE CAPACITY", "[M-03]", formatGen(available), "READY TO UNDERWRITE"],
              ["PREMIUMS IN OPEN COVERS", "[M-04]", formatGen(openP), "ESCROWED UNTIL RESOLUTION"],
              ["OUTSTANDING CREDITS", "[M-05]", formatGen(credits), "PENDING USER WITHDRAWALS"],
              ["TREASURY FEES", "[M-06]", formatGen(treasury), "V1 PROTOCOL SUBSIDY MODE"],
            ].map((m) => (
              <div key={m[1]} className="p-space-md border-b md:border-r border-on-surface flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="font-label-caps text-label-caps uppercase text-on-surface-variant font-bold">{m[0]}</span>
                  <span className="font-mono-spec text-mono-spec text-primary font-bold">{m[1]}</span>
                </div>
                <div className="my-space-md">
                  <div className="font-mono-index text-headline-lg font-bold tracking-tighter text-on-surface">{m[2]}</div>
                </div>
                <div className="font-mono-spec text-mono-spec text-on-surface-variant">{m[3]}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
          <div className="lg:col-span-7 border-2 border-on-surface bg-surface-container-lowest shadow-[4px_4px_0px_#1c1b1b]">
            <div className="bg-on-surface text-surface px-space-md py-2 flex items-center justify-between">
              <div className="flex items-center gap-space-sm">
                <span className="font-mono-spec text-mono-spec bg-primary text-on-primary px-1.5 font-bold">ACT-01</span>
                <span className="font-label-caps text-label-caps uppercase tracking-wider font-bold">
                  CAPITAL PROVISION SWITCHBAY
                </span>
              </div>
              <span className="font-mono-spec text-mono-spec uppercase text-surface-variant">DEV-TESTNET ONLY</span>
            </div>
            <div className="p-space-md lg:p-space-lg flex flex-col gap-space-md">
              <h3 className="font-headline-md text-headline-md font-bold uppercase text-on-surface">FUND UNDERWRITING POOL</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Depositing test GEN supplies capacity for underwriting. No inflated APY promises; testnet economics only.
              </p>
              <label className="font-label-caps text-label-caps uppercase font-bold text-on-surface" htmlFor="deposit-amount">
                [INPUT PARAMETER: LIQUIDITY_INJECTION]
              </label>
              <span className="font-mono-spec text-mono-spec text-on-surface-variant font-bold">
                WALLET: {w.address ? `${formatGen(w.balanceWei)} · ${w.address.slice(0, 8)}…` : "NOT CONNECTED"}
              </span>
              {!w.address ? (
                <button
                  type="button"
                  className="border-2 border-on-surface bg-on-surface text-surface py-2 font-mono-spec text-mono-spec font-bold uppercase"
                  onClick={() => void w.connect().catch((e) => setErr(e instanceof Error ? e.message : String(e)))}
                >
                  {w.connecting ? "CONNECTING…" : "CONNECT WALLET TO DEPOSIT"}
                </button>
              ) : null}
              <div className="flex items-stretch border-2 border-on-surface bg-surface-container-low focus-within:border-primary">
                <input
                  className="w-full bg-transparent px-space-md py-3 font-mono-index text-headline-md font-bold text-on-surface outline-none"
                  id="deposit-amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <div className="bg-surface-container-highest border-l-2 border-on-surface px-space-md flex items-center font-mono-spec text-mono-spec font-bold">
                  tGEN
                </div>
              </div>
              <div className="grid grid-cols-4 gap-space-xs">
                {["100", "500", "1000"].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className="border border-on-surface bg-surface-container hover:bg-surface-container-high py-1.5 font-mono-spec text-mono-spec font-bold uppercase"
                    onClick={() => setAmount(n)}
                  >
                    +{n} tGEN
                  </button>
                ))}
                <button
                  type="button"
                  className="border border-on-surface bg-primary text-on-primary py-1.5 font-mono-spec text-mono-spec font-bold uppercase"
                  onClick={() => setAmount((Number(formatGen(w.balanceWei, { suffix: false }).replace(/,/g, "")) || 0).toString())}
                >
                  [MAX]
                </button>
              </div>
              <button
                className="w-full bg-primary hover:bg-primary-container text-on-primary border-2 border-on-surface py-3.5 px-space-md flex items-center justify-between group shadow-[3px_3px_0px_#1c1b1b] disabled:opacity-50"
                type="button"
                disabled={busy}
                onClick={() => void deposit()}
              >
                <span className="font-headline-md text-headline-md uppercase font-bold tracking-tight">
                  {busy ? "SIGNING…" : "DEPOSIT TEST GEN INTO POOL"}
                </span>
                <span className="bg-on-surface text-surface w-8 h-8 flex items-center justify-center font-bold">→</span>
              </button>
              {err ? (
                <div className="font-mono-spec text-mono-spec text-error whitespace-pre-wrap break-all">{err}</div>
              ) : null}
              <ReceiptPanel receipt={receipt} />
            </div>
          </div>
          <div className="lg:col-span-5 flex flex-col gap-space-md">
            <div className="border-2 border-on-surface bg-secondary p-space-md text-on-secondary shadow-[4px_4px_0px_#1c1b1b] flex flex-col justify-between min-h-[300px]">
              <div>
                <div className="flex items-center justify-between border-b border-surface-container-highest/20 pb-space-xs">
                  <span className="font-mono-spec text-mono-spec bg-on-surface text-surface px-1.5 py-0.5 font-bold uppercase">
                    DIAGNOSTIC-SPEC
                  </span>
                  <span className="font-mono-spec text-mono-spec text-secondary-container font-bold">OPENFDA PROTOCOL LINK</span>
                </div>
                <div className="mt-space-md font-headline-md text-headline-md font-bold tracking-tight text-surface uppercase">
                  INSUFFICIENT FEED PROTOCOL
                </div>
                <p className="font-body-sm text-body-sm text-surface-variant mt-space-xs">
                  When FDA API upstream drops, the contract autonomously defaults to INSUFFICIENT and refunds 100% premium.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
