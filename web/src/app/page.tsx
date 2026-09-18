"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { get_economics, list_ids, type Economics } from "@/lib/contract";
import { formatGen } from "@/lib/format";
import { missingDeployAddress } from "@/lib/network";

export default function LandingPage() {
  const [eco, setEco] = useState<Economics | null>(null);
  const [covers, setCovers] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (missingDeployAddress()) return;
    let live = true;
    (async () => {
      try {
        const [e, ids] = await Promise.all([get_economics(), list_ids()]);
        if (!live) return;
        setEco(e);
        setCovers(ids.length);
      } catch (e) {
        if (live) setErr(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  const capacity = eco ? formatGen(eco.pool_available) : "—";
  const settled = covers == null ? "—" : String(covers);

  return (
    <div className="flex flex-col w-full">
      <div className="w-full bg-surface-container-high px-space-md py-space-xs flex flex-wrap items-center justify-between gap-space-sm">
        <div className="flex items-center gap-space-sm font-mono-spec text-mono-spec">
          <span className="inline-block w-2 h-2 bg-primary" />
          <span className="font-bold text-on-surface uppercase tracking-tight">[STATUS: PUBLIC GATEWAY]</span>
          <span className="text-outline text-mono-spec hidden sm:inline">// HARDWARE REVISION 04.1</span>
          <span className="text-outline text-mono-spec hidden md:inline">// GENLAYER TESTNET: 61997</span>
        </div>
        <div className="flex items-center gap-space-md font-mono-spec text-mono-spec">
          <div className="flex items-center gap-space-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
            <span className="text-tertiary font-bold uppercase">RPC STUDIO-DEV</span>
          </div>
          <Link className="text-on-surface hover:text-primary font-bold tracking-wider underline uppercase" href="/pool">
            [VIEW POOL SPEC]
          </Link>
        </div>
      </div>

      <section className="w-full max-w-7xl mx-auto px-space-md lg:px-space-lg py-space-xl">
        <div className="flex flex-col gap-space-lg">
          <div className="flex flex-wrap items-center gap-space-xs font-mono-spec text-mono-spec">
            <span className="bg-primary text-on-primary font-bold px-space-xs py-0.5 uppercase tracking-wider">
              MODULE REF: RL-GEN97
            </span>
            <span className="bg-on-surface text-surface font-bold px-space-xs py-0.5 uppercase">
              OPENFDA REAL-TIME PIPELINE
            </span>
            <span className="bg-secondary-container text-on-secondary-container font-bold px-space-xs py-0.5 uppercase">
              CLASS I // II // III PARAMETRIC
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-mono-spec text-mono-spec text-primary font-bold tracking-widest uppercase mb-space-xs">
              [ PROTOCOL ARCHITECTURE SPECIFICATION ]
            </span>
            <h1 className="font-headline-xl text-headline-xl md:text-display-hero md:font-display-hero uppercase tracking-tighter text-on-surface max-w-6xl">
              PARAMETRIC FDA RECALL COVER<span className="text-primary">.</span>
              <br className="hidden sm:inline" />
              DETERMINISTIC SETTLEMENT ENGINE<span className="text-outline">_</span>
            </h1>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg pt-space-sm">
            <div className="lg:col-span-8 flex flex-col gap-space-md">
              <p className="font-body-lg text-body-lg text-on-surface font-medium leading-relaxed">
                RecallLine locks test-GEN against FDA-regulated finished pharmaceuticals and medical devices across discrete UTC exposure windows. Settle executes permissionlessly against official{" "}
                <span className="font-mono-spec font-bold text-primary">api.fda.gov</span> JSON enforcements.
              </p>
              <div className="p-space-md bg-surface-container-low flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-md">
                <div className="flex flex-col">
                  <span className="font-label-caps text-label-caps uppercase text-on-surface-variant font-bold">
                    SETTLEMENT GUARANTEE
                  </span>
                  <span className="font-mono-spec text-mono-spec font-bold text-on-surface">
                    ZERO JURY // ZERO DOCKETS // 100% PROGRAMMATIC ESCROW
                  </span>
                </div>
                <Link
                  className="w-full sm:w-auto text-center bg-primary text-on-primary px-space-lg py-space-sm font-label-caps text-label-caps tracking-wider uppercase font-bold hover:bg-on-surface transition-colors shadow-md"
                  href="/buy"
                >
                  [ ENTER APP & CONNECT WALLET → ]
                </Link>
              </div>
            </div>
            <div className="lg:col-span-4 flex flex-col justify-between bg-surface-container p-space-md shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-mono-spec text-mono-spec text-on-surface-variant uppercase font-bold">
                  [CHASSIS STATUS]
                </span>
                <span className="font-mono-spec text-mono-spec bg-tertiary text-on-tertiary px-space-xs py-0.5 uppercase font-bold">
                  READY
                </span>
              </div>
              <div className="my-space-md font-mono-spec text-mono-spec flex flex-col gap-1">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">HOST CHAIN:</span>
                  <span className="font-bold text-on-surface">61997 (GENLAYER)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">CONSENSUS:</span>
                  <span className="font-bold text-on-surface">OPTIMISTIC EXECUTION</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">ORACLE PARSER:</span>
                  <span className="font-bold text-primary">NATIVE HTTP JSON</span>
                </div>
              </div>
              <div className="w-full bg-surface-variant h-1.5">
                <div className="bg-primary h-full w-full" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full bg-on-surface text-surface py-space-md px-space-md lg:px-space-lg">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-space-md font-mono-spec text-mono-spec">
          <div className="flex flex-col p-space-sm bg-inverse-surface shadow-inner">
            <span className="text-outline text-label-caps font-label-caps uppercase tracking-wider">
              [ACTIVE CAPACITY]
            </span>
            <span className="text-mono-index font-mono-index text-primary-fixed font-bold mt-1">
              {capacity}
            </span>
            <span className="text-label-caps font-label-caps text-secondary-container mt-1">
              get_economics() POOL AVAILABLE
            </span>
          </div>
          <div className="flex flex-col p-space-sm bg-inverse-surface shadow-inner">
            <span className="text-outline text-label-caps font-label-caps uppercase tracking-wider">
              [COVERS]
            </span>
            <span className="text-mono-index font-mono-index text-surface font-bold mt-1">
              {settled} <span className="text-mono-spec font-normal text-surface-variant">CONTRACTS</span>
            </span>
            <span className="text-label-caps font-label-caps text-secondary-container mt-1">
              ✓ 0 DISPUTES RECORDED
            </span>
          </div>
          <div className="flex flex-col p-space-sm bg-inverse-surface shadow-inner">
            <span className="text-outline text-label-caps font-label-caps uppercase tracking-wider">
              [ORACLE HOST]
            </span>
            <span className="text-mono-index font-mono-index text-surface font-bold mt-1 truncate">
              api.fda.gov
            </span>
            <span className="text-label-caps font-label-caps text-primary-fixed mt-1">
              HTTP/2 ENFORCEMENT FEED
            </span>
          </div>
          <div className="flex flex-col p-space-sm bg-inverse-surface shadow-inner">
            <span className="text-outline text-label-caps font-label-caps uppercase tracking-wider">
              [DISPUTE PERIOD]
            </span>
            <span className="text-mono-index font-mono-index text-secondary-fixed font-bold mt-1">
              0.00 <span className="text-mono-spec font-normal text-surface">SECONDS</span>
            </span>
            <span className="text-label-caps font-label-caps text-tertiary-fixed mt-1">
              DETERMINISTIC ATOMICITY
            </span>
          </div>
        </div>
      </section>
      {err ? (
        <div className="max-w-7xl mx-auto px-space-md py-space-sm font-mono-spec text-mono-spec text-error">
          {err}
        </div>
      ) : null}

      <section className="w-full max-w-7xl mx-auto px-space-md lg:px-space-lg py-space-xl">
        <div className="relative w-full h-80 md:h-96 overflow-hidden shadow-xl flex flex-col justify-end p-space-lg bg-on-surface">
          <div className="absolute inset-0 bg-gradient-to-t from-on-surface/90 via-on-surface/40 to-transparent" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-end justify-between gap-space-md text-surface">
            <div className="flex flex-col gap-1 max-w-2xl">
              <div className="flex items-center gap-space-xs font-mono-spec text-mono-spec">
                <span className="bg-primary text-on-primary px-space-xs py-0.5 font-bold uppercase">
                  PHYSICAL METAPHOR CHASSIS
                </span>
                <span className="text-surface-variant">// AUTOMATED SETTLE APPARATUS</span>
              </div>
              <h2 className="font-headline-lg text-headline-lg uppercase font-bold tracking-tight text-surface">
                RIGID PROTOCOL STATE MACHINE
              </h2>
              <p className="font-body-md text-body-md text-surface-variant">
                Engineered with zero ambient blur, mechanical unblurred drop structures, and deterministic cryptographic feeds on GenLayer Studio Next.
              </p>
            </div>
            <div className="bg-surface text-on-surface p-space-md flex flex-col gap-1 shadow-lg shrink-0">
              <span className="font-mono-spec text-mono-spec text-on-surface-variant font-bold uppercase">
                CURRENT NETWORK LOAD
              </span>
              <span className="font-mono-index text-mono-index font-bold text-tertiary">—</span>
              <span className="font-label-caps text-label-caps text-outline uppercase">TESTNET STABLE</span>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full max-w-7xl mx-auto px-space-md lg:px-space-lg pb-space-xl">
        <div className="flex flex-col gap-space-md mb-space-lg">
          <div className="flex items-center gap-space-xs font-mono-spec text-mono-spec text-primary font-bold">
            <span>[03 MODULES]</span>
            <span>//</span>
            <span className="uppercase">CORE PROTOCOL PRIMITIVES</span>
          </div>
          <h2 className="font-headline-lg text-headline-lg uppercase font-bold tracking-tight text-on-surface">
            ENGINEERED FOR ABSOLUTE MECHANICAL CLARITY
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg">
          <div className="flex flex-col bg-surface-container p-space-lg shadow-md hover:-translate-y-1 transition-transform">
            <div className="flex items-center justify-between pb-space-sm mb-space-sm bg-surface-container-high p-space-xs">
              <span className="font-mono-spec text-mono-spec font-bold text-primary">[01] DETERMINISTIC ORACLE</span>
              <span className="w-2.5 h-2.5 bg-primary" />
            </div>
            <h3 className="font-headline-md text-headline-md uppercase font-bold text-on-surface mb-space-xs">
              OPENFDA REAL-TIME PIPELINE
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant mb-space-md flex-1">
              Direct query to <code className="font-mono-spec text-primary font-bold bg-surface-container-lowest px-1 py-0.5">api.fda.gov/drug/enforcement.json</code>. Zero third-party web scrapers, zero jury vote pools, and zero subjective attestations.
            </p>
            <div className="bg-surface-container-lowest p-space-sm font-mono-spec text-mono-spec flex flex-col gap-1.5">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">CLASS I RECALL:</span>
                <span className="font-bold text-primary">3.0X PAYOUT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">CLASS II RECALL:</span>
                <span className="font-bold text-on-surface">2.0X PAYOUT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">NO ENFORCEMENT:</span>
                <span className="font-bold text-tertiary">PREMIUM → POOL</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col bg-surface-container p-space-lg shadow-md hover:-translate-y-1 transition-transform">
            <div className="flex items-center justify-between pb-space-sm mb-space-sm bg-surface-container-high p-space-xs">
              <span className="font-mono-spec text-mono-spec font-bold text-primary">[02] DISCRETE WINDOWS</span>
              <span className="w-2.5 h-2.5 bg-primary" />
            </div>
            <h3 className="font-headline-md text-headline-md uppercase font-bold text-on-surface mb-space-xs">
              TIME-LOCKED UTC OBSERVATION
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant mb-space-md flex-1">
              Covers enforce a strict 24-hour pre-start buffer and flexible 1 to 14-day exposure durations. Fully cancelable prior to epoch start; strictly immutable and mathematically unalterable once live.
            </p>
            <div className="bg-surface-container-lowest p-space-sm font-mono-spec text-mono-spec flex flex-col gap-1.5">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">PRE-START BUFFER:</span>
                <span className="font-bold text-on-surface">24H FIXED UTC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">EXPOSURE RANGE:</span>
                <span className="font-bold text-on-surface">1 - 14 DAYS</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">CANCELLATION:</span>
                <span className="font-bold text-tertiary">100% UNTIL START</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col bg-surface-container p-space-lg shadow-md hover:-translate-y-1 transition-transform">
            <div className="flex items-center justify-between pb-space-sm mb-space-sm bg-surface-container-high p-space-xs">
              <span className="font-mono-spec text-mono-spec font-bold text-primary">[03] SOLVENT ESCROW</span>
              <span className="w-2.5 h-2.5 bg-primary" />
            </div>
            <h3 className="font-headline-md text-headline-md uppercase font-bold text-on-surface mb-space-xs">
              IMMEDIATE REFUND FAILSAFE
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant mb-space-md flex-1">
              100% pool solvency verified at contract genesis before underwriting. If the openFDA upstream feed is unreachable, malformed, or ambiguous, contract transitions to INSUFFICIENT state with zero slippage.
            </p>
            <div className="bg-surface-container-lowest p-space-sm font-mono-spec text-mono-spec flex flex-col gap-1.5">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">POOL SOLVENCY:</span>
                <span className="font-bold text-tertiary">STRICT 100%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">ORACLE TIMEOUT:</span>
                <span className="font-bold text-primary">FULL REFUND</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">PROTOCOL SLIPPAGE:</span>
                <span className="font-bold text-on-surface">0.00 tGEN</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full bg-surface-container-low py-space-xl">
        <div className="max-w-7xl mx-auto px-space-md lg:px-space-lg flex flex-col gap-space-lg">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-sm">
            <div className="flex flex-col gap-1">
              <span className="font-mono-spec text-mono-spec text-primary font-bold uppercase tracking-wider">
                [LIVE TELEMETRY DEMONSTRATION]
              </span>
              <h2 className="font-headline-lg text-headline-lg uppercase font-bold text-on-surface">
                SAMPLE CONTRACT EXECUTION CHASSIS
              </h2>
            </div>
            <span className="font-mono-spec text-mono-spec bg-secondary-container text-on-secondary-container px-space-sm py-1 font-bold uppercase">
              READY FOR PERMISSIONLESS SETTLE
            </span>
          </div>
          <div className="w-full bg-surface-container p-space-lg shadow-xl flex flex-col lg:flex-row gap-space-lg items-stretch">
            <div className="flex-1 flex flex-col justify-between gap-space-md">
              <div className="flex flex-col gap-space-xs">
                <div className="flex items-center gap-space-xs">
                  <span className="bg-on-surface text-surface font-mono-spec text-mono-spec px-space-xs py-0.5 font-bold uppercase">
                    ID FROM CONTRACT HASH
                  </span>
                  <span className="bg-tertiary-container text-on-tertiary-container font-mono-spec text-mono-spec px-space-xs py-0.5 font-bold uppercase">
                    WINDOW COMPLETED
                  </span>
                </div>
                <h3 className="font-headline-md text-headline-md uppercase font-bold text-on-surface mt-space-xs">
                  NDC // PRODUCT KEY FROM COVER
                </h3>
                <span className="font-mono-spec text-mono-spec text-on-surface-variant font-bold">
                  Browse live covers for real hashes. UI never assigns COVER-0001 IDs.
                </span>
              </div>
              <div className="flex flex-col gap-space-xs bg-surface-container-lowest p-space-md shadow-sm">
                <span className="font-mono-spec text-mono-spec text-outline font-bold uppercase">
                  [OBSERVATION TIMELINE]
                </span>
                <div className="grid grid-cols-4 gap-2 text-center font-mono-spec text-mono-spec pt-1">
                  <div className="bg-surface-variant text-on-surface-variant p-space-xs font-bold">
                    01: BUFFER<br />
                    <span className="text-tertiary">✓ OK</span>
                  </div>
                  <div className="bg-surface-variant text-on-surface-variant p-space-xs font-bold">
                    02: ACTIVE<br />
                    <span className="text-tertiary">✓ WINDOW</span>
                  </div>
                  <div className="bg-primary text-on-primary p-space-xs font-bold animate-pulse">
                    03: RIPE<br />
                    <span>READY</span>
                  </div>
                  <div className="bg-surface-container-high text-outline p-space-xs font-bold">
                    04: ARCHIVED<br />
                    <span>PENDING</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="w-full lg:w-96 bg-surface-container-high p-space-md flex flex-col justify-between gap-space-md shadow-inner">
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="font-label-caps text-label-caps font-bold text-on-surface-variant uppercase">
                    PERMISSIONLESS SETTLE
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-space-xs">
                  Anyone can trigger contract settlement. GenLayer execution verifies the openFDA JSON response deterministically. The contract has no settlement bounty.
                </p>
              </div>
              <Link
                className="w-full text-center bg-primary text-on-primary py-space-md font-label-caps text-label-caps font-bold uppercase tracking-wider hover:bg-on-surface transition-all shadow-md active:translate-x-0.5 active:translate-y-0.5"
                href="/browse"
              >
                [ LAUNCH TESTNET APP TO SETTLE → ]
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full max-w-7xl mx-auto px-space-md lg:px-space-lg py-space-xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-center">
          <div className="lg:col-span-6 bg-on-surface text-surface p-space-lg shadow-xl flex flex-col gap-space-md">
            <div className="flex items-center justify-between font-mono-spec text-mono-spec">
              <span className="text-primary font-bold uppercase">[EXECUTION VECTOR // PIPELINE]</span>
              <span className="text-outline">ISO/IEC 8825-1</span>
            </div>
            <svg className="w-full h-auto text-surface" viewBox="0 0 400 200">
              <rect fill="currentColor" fillOpacity="0.1" height="50" stroke="currentColor" strokeWidth="1.5" width="100" x="10" y="20" />
              <text fill="currentColor" fontFamily="Space Mono" fontSize="9" fontWeight="bold" textAnchor="middle" x="60" y="45">
                COVER BUYER
              </text>
              <text fill="#F04E23" fontFamily="Space Mono" fontSize="8" textAnchor="middle" x="60" y="58">
                LOCK tGEN
              </text>
              <line stroke="#F04E23" strokeDasharray="3 2" strokeWidth="1.5" x1="110" x2="150" y1="45" y2="45" />
              <polygon fill="#F04E23" points="150,45 145,42 145,48" />
              <rect fill="#F04E23" fillOpacity="0.2" height="60" stroke="#F04E23" strokeWidth="1.5" width="110" x="150" y="15" />
              <text fill="currentColor" fontFamily="Space Mono" fontSize="9" fontWeight="bold" textAnchor="middle" x="205" y="42">
                GENLAYER 61997
              </text>
              <text fill="currentColor" fontFamily="Space Mono" fontSize="8" textAnchor="middle" x="205" y="55">
                ESCROW ENGINE
              </text>
              <line stroke="currentColor" strokeWidth="1.5" x1="205" x2="205" y1="75" y2="120" />
              <polygon fill="currentColor" points="205,120 202,115 208,115" />
              <rect fill="currentColor" fillOpacity="0.1" height="50" stroke="currentColor" strokeWidth="1.5" width="130" x="140" y="120" />
              <text fill="#59de9b" fontFamily="Space Mono" fontSize="9" fontWeight="bold" textAnchor="middle" x="205" y="145">
                api.fda.gov (HTTP/2)
              </text>
              <text fill="currentColor" fontFamily="Space Mono" fontSize="8" textAnchor="middle" x="205" y="158">
                ENFORCEMENT JSON
              </text>
              <line stroke="#59de9b" strokeWidth="1.5" x1="260" x2="300" y1="45" y2="45" />
              <polygon fill="#59de9b" points="300,45 295,42 295,48" />
              <rect fill="#006a42" fillOpacity="0.3" height="50" stroke="#59de9b" strokeWidth="1.5" width="90" x="300" y="20" />
              <text fill="#59de9b" fontFamily="Space Mono" fontSize="9" fontWeight="bold" textAnchor="middle" x="345" y="45">
                DETERMINISTIC
              </text>
              <text fill="currentColor" fontFamily="Space Mono" fontSize="8" textAnchor="middle" x="345" y="58">
                PAYOUT (3X / 2X)
              </text>
            </svg>
            <div className="font-mono-spec text-mono-spec text-outline flex justify-between">
              <span>SOURCE VALIDATION: PARSED RFC 8259</span>
              <span className="text-tertiary font-bold">STATE: VERIFIED</span>
            </div>
          </div>
          <div className="lg:col-span-6 flex flex-col gap-space-md">
            <div className="flex flex-col gap-space-xs">
              <span className="font-mono-spec text-mono-spec text-primary font-bold uppercase">[MECHANICAL GUARANTEE]</span>
              <h3 className="font-headline-lg text-headline-lg uppercase font-bold text-on-surface">
                NO DISCRETION. ZERO AMBIGUITY.
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Traditional parametric platforms require multi-sig oracles, speculative market resolution pools, or legal juries. RecallLine removes every subjective layer. If the FDA official JSON record contains the NDC in an active recall during the window, settlement is mathematically guaranteed.
              </p>
            </div>
            <div className="flex flex-col gap-space-sm pt-space-xs">
              <div className="flex items-center gap-space-sm bg-surface-container p-space-sm shadow-sm">
                <span className="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center font-mono-spec text-mono-spec font-bold shrink-0">
                  1
                </span>
                <span className="font-body-md text-body-md font-medium text-on-surface">
                  Select pharmaceutical finished NDC code or medical device registry
                </span>
              </div>
              <div className="flex items-center gap-space-sm bg-surface-container p-space-sm shadow-sm">
                <span className="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center font-mono-spec text-mono-spec font-bold shrink-0">
                  2
                </span>
                <span className="font-body-md text-body-md font-medium text-on-surface">
                  Deposit tGEN into the dedicated discrete time-locked solvency bay
                </span>
              </div>
              <div className="flex items-center gap-space-sm bg-surface-container p-space-sm shadow-sm">
                <span className="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center font-mono-spec text-mono-spec font-bold shrink-0">
                  3
                </span>
                <span className="font-body-md text-body-md font-medium text-on-surface">
                  Settlement triggers permissionlessly by anyone for immediate payout
                </span>
              </div>
            </div>
            <div className="pt-space-sm">
              <Link
                className="inline-flex items-center gap-space-sm font-label-caps text-label-caps uppercase text-primary hover:text-on-surface font-bold tracking-wider underline"
                href="/how"
              >
                [ READ FULL MECHANICAL WHITE-SHEET → ]
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full bg-surface-container-high py-space-xl">
        <div className="max-w-7xl mx-auto px-space-md lg:px-space-lg flex flex-col md:flex-row items-center justify-between gap-space-lg">
          <div className="flex flex-col gap-space-xs">
            <span className="font-mono-spec text-mono-spec text-primary font-bold uppercase">
              [DEPLOYMENT ACCESS // TESTNET 61997]
            </span>
            <h3 className="font-headline-lg text-headline-lg uppercase font-bold text-on-surface">
              READY TO SECURE COVER ON GENLAYER STUDIO?
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-xl">
              Connect your Web3 wallet, switch to GenLayer Studio Next Chain 61997, and access the high-frequency parametric terminal immediately.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-space-sm shrink-0 w-full md:w-auto">
            <Link
              className="w-full sm:w-auto text-center bg-surface-container-lowest text-on-surface px-space-lg py-space-md font-label-caps text-label-caps uppercase font-bold tracking-wider hover:bg-surface-variant transition-colors shadow-sm"
              href="/browse"
            >
              [01] BROWSE ACTIVE POOLS
            </Link>
            <Link
              className="w-full sm:w-auto text-center bg-primary text-on-primary px-space-lg py-space-md font-label-caps text-label-caps uppercase font-bold tracking-wider hover:bg-on-surface transition-colors shadow-md"
              href="/buy"
            >
              [02] ENTER APPLICATION →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
