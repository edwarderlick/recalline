import Link from "next/link";

export default function HowPage() {
  return (
    <div className="flex flex-col w-full">
      <section className="w-full bg-surface-container-low px-space-md lg:px-space-xl py-space-xl">
        <div className="max-w-[1360px] mx-auto flex flex-col gap-space-lg">
          <div className="flex flex-wrap items-center justify-between gap-space-sm pb-space-sm border-b-2 border-on-surface">
            <div className="flex items-center gap-space-xs font-mono-spec text-mono-spec font-bold uppercase tracking-wider text-on-surface">
              <span className="bg-primary text-on-primary px-space-xs py-0.5">MANUAL DOC-984</span>
              <span>PROTOCOL SPECIFICATION // REV 2.4.1</span>
              <span className="text-primary">//</span>
              <span className="text-tertiary">STABILITY: DETERMINISTIC</span>
            </div>
            <div className="flex items-center gap-space-md font-mono-spec text-mono-spec">
              <span className="bg-surface-container-high px-space-sm py-0.5 font-bold text-on-surface">
                RPC 61997 STUDIO NEXT
              </span>
              <span className="bg-secondary-container text-on-secondary-container px-space-sm py-0.5 font-bold">
                STATE: AUTONOMOUS
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
            <div className="lg:col-span-8 flex flex-col gap-space-md">
              <div className="flex items-center gap-space-xs font-mono-spec text-mono-spec text-primary font-bold uppercase tracking-widest">
                <span>[SECTION 00]</span>
                <span className="w-8 h-[2px] bg-primary" />
                <span>SYSTEM CONSTITUTION</span>
              </div>
              <h1 className="font-headline-xl text-headline-xl text-on-surface uppercase tracking-tighter leading-none font-bold">
                TIME-GATED SAFETY COVER SETTLED FROM OFFICIAL{" "}
                <span className="text-primary underline decoration-4">FDA ENFORCEMENT JSON</span>.
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-3xl leading-relaxed">
                RecallLine is not a legal court, not an appeal board, and not an AI judge. It is a strictly deterministic, time-locked parametric insurance instrument running on{" "}
                <span className="font-bold text-on-surface">GenLayer Studio Next (Chain ID 61997)</span>.
              </p>
            </div>
            <div className="lg:col-span-4 bg-surface-container-highest p-space-md flex flex-col gap-space-sm border-l-4 border-primary">
              <div className="flex justify-between items-center font-mono-spec text-mono-spec uppercase font-bold text-on-surface">
                <span>PARADIGM CHECK</span>
                <span className="text-tertiary">● COMPILED</span>
              </div>
              <div className="font-mono-spec text-mono-spec text-on-surface flex flex-col gap-space-xs leading-normal">
                <div className="flex justify-between pb-1 border-b border-outline-variant">
                  <span className="text-on-surface-variant">DISPUTE ARBITRATION:</span>
                  <span className="font-bold text-error">0% (NONE)</span>
                </div>
                <div className="flex justify-between pb-1 border-b border-outline-variant">
                  <span className="text-on-surface-variant">SETTLEMENT ENGINE:</span>
                  <span className="font-bold">GENLAYER JSON MATCH</span>
                </div>
                <div className="flex justify-between pb-1 border-b border-outline-variant">
                  <span className="text-on-surface-variant">ORACLE INGESTION:</span>
                  <span className="font-bold">openFDA JSON DIRECT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">EXECUTION LATENCY:</span>
                  <span className="font-bold text-primary">ATOMIC ON-CHAIN</span>
                </div>
              </div>
              <div className="pt-space-xs">
                <div className="bg-primary text-on-primary p-space-xs font-mono-spec text-mono-spec text-center font-bold tracking-widest uppercase">
                  NO APPEAL // NO HUMAN JURY // CODE IS SETTLEMENT
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full bg-surface-container py-space-xl px-space-md lg:px-space-xl">
        <div className="max-w-[1360px] mx-auto flex flex-col gap-space-lg">
          <div className="flex flex-col md:flex-row md:items-end justify-between pb-space-sm border-b-2 border-on-surface gap-space-xs">
            <div>
              <span className="font-mono-spec text-mono-spec text-primary font-bold tracking-widest uppercase">
                [01] OPERATIONAL PIPELINE
              </span>
              <h2 className="font-headline-lg text-headline-lg font-bold uppercase tracking-tight text-on-surface">
                6-STAGE PARAMETRIC EXECUTION CYCLE
              </h2>
            </div>
            <span className="font-mono-spec text-mono-spec text-on-surface-variant uppercase">
              SEQ // 01 THROUGH 06 (DETERMINISTIC ADVANCEMENT)
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md">
            {[
              ["[01]", "SPECIFICATION", "TEMPLATE IDENTIFICATION", "Buyer specifies strictly validated medical/pharmaceutical schema: National Drug Code (NDC), Brand + Generic Name, or FDA Device Product Code alongside a precise product key.", 'KEY_PARSE: "0069-3150-83" // VERIFIED'],
              ["[02]", "TEMPORAL LOCK", "TIME WINDOW RESERVATION", "Buyer locks a discrete future UTC window duration (1 to 14 standard 24h days). To eliminate front-running, coverage start must be set ≥ 24 hours in advance.", "UTC_GATE: NOW + 86,400s MINIMUM"],
              ["[03]", "COLLATERAL", "PREMIUM LOCK & 2X RESERVE", "Buyer locks test GEN premium into the vault. The contract sequesters 2.0x extra reserve from the pool so Class I can pay 3x total.", "POOL_RESERVE: [PREMIUM * 2] COLD"],
              ["[04]", "WINDOW EXPIRATION", "WINDOW CLOSE & GRACE PERIOD", "The coverage interval expires. A 7-day settlement grace window opens. Anyone with a wallet can execute settle().", "PUBLIC_INVOKE: SETTLE() GRACE = 7 DAYS"],
              ["[05]", "ORACLE INGEST", "DIRECT OPENFDA ORACLE INGEST", "GenLayer fetches api.fda.gov using contract-assembled parameters. No intermediary or off-chain signer can tamper with payload filters.", "GET /drug/enforcement.json?search=..."],
              ["[06]", "FINALITY", "TERMINAL ATOMIC SETTLEMENT", "The transaction resolves atomically. Payouts (3x/2x) or refunds flow to the buyer, or premium stays in the pool. Zero appeal period.", "STATUS: SETTLED // ZERO HUMAN INTERACTION"],
            ].map(([idx, tag, title, body, foot]) => (
              <div key={idx} className="bg-surface-container-lowest p-space-md flex flex-col justify-between shadow-md transition-transform hover:-translate-y-1">
                <div className="flex flex-col gap-space-sm">
                  <div className="flex items-center justify-between border-b border-surface-container-high pb-space-xs">
                    <span className="bg-on-surface text-surface font-mono-index text-mono-index px-space-xs py-0.5 font-bold">{idx}</span>
                    <span className="font-mono-spec text-mono-spec text-primary font-bold uppercase tracking-wider">{tag}</span>
                  </div>
                  <h3 className="font-headline-md text-headline-md uppercase font-bold text-on-surface">{title}</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant">{body}</p>
                </div>
                <div className="mt-space-md pt-space-xs bg-surface-container-high p-space-xs font-mono-spec text-mono-spec text-on-surface">
                  {foot}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full bg-surface-container-lowest py-space-xl px-space-md lg:px-space-xl">
        <div className="max-w-[1360px] mx-auto flex flex-col gap-space-lg">
          <div className="flex flex-col md:flex-row md:items-end justify-between pb-space-sm border-b-2 border-on-surface gap-space-xs">
            <div>
              <span className="font-mono-spec text-mono-spec text-primary font-bold tracking-widest uppercase">
                [02] DETERMINISTIC MATRIX
              </span>
              <h2 className="font-headline-lg text-headline-lg font-bold uppercase tracking-tight text-on-surface">
                COMPLETE OUTCOME RULES ENGINE
              </h2>
            </div>
            <div className="flex items-center gap-space-xs font-mono-spec text-mono-spec bg-surface-container-high px-space-sm py-1 font-bold">
              <span>BYTECODE ENFORCED: GENLAYER 61997</span>
            </div>
          </div>
          <div className="overflow-x-auto shadow-md">
            <table className="w-full text-left font-mono-spec text-mono-spec border-collapse">
              <thead>
                <tr className="bg-on-surface text-surface text-label-caps uppercase tracking-widest font-bold">
                  <th className="p-space-md">OUTCOME CODE</th>
                  <th className="p-space-md">TRIGGER CONDITIONS (OPENFDA SPEC)</th>
                  <th className="p-space-md">FINANCIAL ACTION</th>
                  <th className="p-space-md">POOL EXPOSURE DISPOSITION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-high bg-surface-container-low font-body-md text-body-md">
                <tr>
                  <td className="p-space-md font-mono-spec font-bold text-on-surface">
                    <span className="bg-primary text-on-primary px-space-xs py-0.5 text-label-caps font-bold">HIT // CL-I</span> HIT Class I
                  </td>
                  <td className="p-space-md text-on-surface-variant font-mono-spec text-mono-spec">
                    Verified FDA Class I recall inside the coverage UTC window for the specified product key.
                  </td>
                  <td className="p-space-md font-mono-spec font-bold text-primary">BUYER PAYOUT: 3.0x PREMIUM</td>
                  <td className="p-space-md text-on-surface-variant font-mono-spec text-mono-spec">
                    Pool capital decreases by 2x reserve; buyer receives 3x.
                  </td>
                </tr>
                <tr>
                  <td className="p-space-md font-mono-spec font-bold text-on-surface">
                    <span className="bg-primary-container text-on-primary-container px-space-xs py-0.5 text-label-caps font-bold">HIT // CL-II</span> HIT Class II
                  </td>
                  <td className="p-space-md text-on-surface-variant font-mono-spec text-mono-spec">
                    Verified FDA Class II recall inside the coverage UTC window.
                  </td>
                  <td className="p-space-md font-mono-spec font-bold text-primary-container">BUYER PAYOUT: 2.0x PREMIUM</td>
                  <td className="p-space-md text-on-surface-variant font-mono-spec text-mono-spec">
                    Pool capital decreases by 1x; buyer receives 2x.
                  </td>
                </tr>
                <tr>
                  <td className="p-space-md font-mono-spec font-bold text-on-surface">
                    <span className="bg-tertiary text-on-tertiary px-space-xs py-0.5 text-label-caps font-bold">NO HIT</span> NOHIT
                  </td>
                  <td className="p-space-md text-on-surface-variant font-mono-spec text-mono-spec">
                    Feed readable, zero Class I/II match. Class III or none is NOHIT; premium stays.
                  </td>
                  <td className="p-space-md font-mono-spec font-bold text-tertiary">0.0x PAYOUT (PREMIUM RETAINED)</td>
                  <td className="p-space-md text-on-surface-variant font-mono-spec text-mono-spec">
                    Premium remains in pool. Reserve released.
                  </td>
                </tr>
                <tr>
                  <td className="p-space-md font-mono-spec font-bold text-on-surface">
                    <span className="bg-surface-container-highest text-on-surface px-space-xs py-0.5 text-label-caps font-bold">INS-FEED</span> INSUFFICIENT
                  </td>
                  <td className="p-space-md text-on-surface-variant font-mono-spec text-mono-spec">
                    openFDA offline, non-JSON, oversize, or missing meta.results.
                  </td>
                  <td className="p-space-md font-mono-spec font-bold text-on-surface">100% PREMIUM REFUNDED</td>
                  <td className="p-space-md text-on-surface-variant font-mono-spec text-mono-spec">
                    Full buyer reimbursement. Reserve restored.
                  </td>
                </tr>
                <tr>
                  <td className="p-space-md font-mono-spec font-bold text-on-surface">
                    <span className="bg-surface-container-highest text-on-surface px-space-xs py-0.5 text-label-caps font-bold">ABORT</span> CANCELED
                  </td>
                  <td className="p-space-md text-on-surface-variant font-mono-spec text-mono-spec">
                    Buyer cancels while OPEN and now &lt; window_start.
                  </td>
                  <td className="p-space-md font-mono-spec font-bold text-on-surface">100% PREMIUM REFUNDED</td>
                  <td className="p-space-md text-on-surface-variant font-mono-spec text-mono-spec">Reserve released immediately.</td>
                </tr>
                <tr>
                  <td className="p-space-md font-mono-spec font-bold text-on-surface">
                    <span className="bg-error text-on-error px-space-xs py-0.5 text-label-caps font-bold">TIMEOUT</span> EXPIRED
                  </td>
                  <td className="p-space-md text-on-surface-variant font-mono-spec text-mono-spec">
                    now ≥ expire_at without settle().
                  </td>
                  <td className="p-space-md font-mono-spec font-bold text-on-surface">100% PREMIUM REFUNDED</td>
                  <td className="p-space-md text-on-surface-variant font-mono-spec text-mono-spec">Fail-safe unlocks reserve.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="w-full bg-surface-container-high py-space-xl px-space-md lg:px-space-xl">
        <div className="max-w-[1360px] mx-auto flex flex-col gap-space-lg">
          <div className="flex flex-col md:flex-row md:items-end justify-between pb-space-sm border-b-2 border-on-surface gap-space-xs">
            <div>
              <span className="font-mono-spec text-mono-spec text-primary font-bold tracking-widest uppercase">
                [03] STRICT CONSTRAINTS
              </span>
              <h2 className="font-headline-lg text-headline-lg font-bold uppercase tracking-tight text-on-surface">
                UNDERWRITING RULES (ZERO OVERRIDES)
              </h2>
            </div>
            <span className="font-mono-spec text-mono-spec text-on-surface-variant uppercase font-bold">
              HARD CODED REJECTION GATES
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
            <div className="bg-surface-container-lowest p-space-md flex flex-col gap-space-sm border-t-4 border-on-surface shadow-sm">
              <div className="flex items-center justify-between font-mono-spec text-mono-spec font-bold">
                <span className="text-primary tracking-widest">[RULE 01 // TEMPORAL BUFFER]</span>
                <span className="bg-surface-container-high px-space-xs py-0.5">GATE_FAIL: REVERT</span>
              </div>
              <h4 className="font-headline-md text-headline-md uppercase font-bold text-on-surface">
                NO COVERAGE BUYS INSIDE ACTIVE WINDOW
              </h4>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Coverage purchases must occur at least <span className="font-bold text-on-surface">24 hours prior</span> to window_start. Window length is 1–14 days.
              </p>
            </div>
            <div className="bg-surface-container-lowest p-space-md flex flex-col gap-space-sm border-t-4 border-on-surface shadow-sm">
              <div className="flex items-center justify-between font-mono-spec text-mono-spec font-bold">
                <span className="text-primary tracking-widest">[RULE 02 // RECENT TAINT REJECTION]</span>
                <span className="bg-surface-container-high px-space-xs py-0.5">LOOKBACK: 30D</span>
              </div>
              <h4 className="font-headline-md text-headline-md uppercase font-bold text-on-surface">
                NO BUYS ON PRODUCTS WITH 30-DAY CLASS I/II RECALL
              </h4>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Lookback is 30 days. Class I/II identity match reverts buy. Unreadable lookback feed does not revert buy.
              </p>
            </div>
            <div className="bg-surface-container-lowest p-space-md flex flex-col gap-space-sm border-t-4 border-on-surface shadow-sm">
              <div className="flex items-center justify-between font-mono-spec text-mono-spec font-bold">
                <span className="text-primary tracking-widest">[RULE 03 // LIQUIDITY SOLVENCY LOCK]</span>
                <span className="bg-surface-container-high px-space-xs py-0.5">RATIO: 2.0X RESERVE</span>
              </div>
              <h4 className="font-headline-md text-headline-md uppercase font-bold text-on-surface">
                SOLVENCY RESERVATION CAP REQUIRED
              </h4>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Buy reverts if pool_available &lt; premium × 2 reserve. Class I pays 3x, Class II 2x, Class III or none NOHIT.
              </p>
            </div>
            <div className="bg-surface-container-lowest p-space-md flex flex-col gap-space-sm border-t-4 border-on-surface shadow-sm">
              <div className="flex items-center justify-between font-mono-spec text-mono-spec font-bold">
                <span className="text-primary tracking-widest">[RULE 04 // AMBIGUOUS INPUT REJECTION]</span>
                <span className="bg-surface-container-high px-space-xs py-0.5">STRICT REGEX</span>
              </div>
              <h4 className="font-headline-md text-headline-md uppercase font-bold text-on-surface">
                VAGUE PRODUCT KEYS REJECTED
              </h4>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Buyer cannot pass a URL. DRUG_NAME requires brand AND generic. NDC is 10/11 digits. Device codes are 3–10 alphanumeric.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full bg-surface-container-lowest py-space-xl px-space-md lg:px-space-xl border-t-2 border-on-surface">
        <div className="max-w-[1360px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-space-xl bg-surface-container-low p-space-xl shadow-lg">
          <div className="flex flex-col gap-space-sm max-w-2xl">
            <div className="flex items-center gap-space-xs font-mono-spec text-mono-spec text-primary font-bold uppercase tracking-wider">
              <span className="h-2 w-2 bg-primary" />
              <span>SYSTEM READY FOR DEPLOYMENT</span>
            </div>
            <h3 className="font-headline-xl text-headline-xl uppercase font-bold text-on-surface tracking-tight leading-none">
              SECURE AUTONOMOUS COVERAGE NOW
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Connect your Web3 wallet to GenLayer Studio Next to inspect active FDA recall lines, review current pool yields, or instantiate deterministic safety cover.
            </p>
            <div className="flex flex-wrap items-center gap-space-md pt-space-xs font-mono-spec text-mono-spec">
              <div className="bg-surface-container-high px-space-sm py-1 font-bold text-on-surface">NETWORK: GENLAYER NEXT</div>
              <div className="bg-surface-container-high px-space-sm py-1 font-bold text-primary">CHAIN ID: 61997</div>
              <div className="bg-surface-container-high px-space-sm py-1 font-bold text-tertiary">CURRENCY: tGEN</div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-space-md w-full lg:w-auto">
            <Link
              className="w-full sm:w-auto inline-flex items-center justify-between gap-space-md bg-primary hover:bg-primary-container text-on-primary font-label-caps text-label-caps uppercase px-space-lg py-space-md tracking-wider font-bold transition-all shadow-md"
              href="/buy"
            >
              <span>ENTER APP & BUY COVER</span>
              <span className="material-symbols-outlined font-bold">arrow_forward</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
