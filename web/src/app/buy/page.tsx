"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { buy_cover, get_economics, list_ids } from "@/lib/contract";
import { daysBetween, formatGen, parseGenInput, parseUtc } from "@/lib/format";
import { missingDeployAddress } from "@/lib/network";
import { useWallet } from "@/lib/WalletContext";
import { ReceiptPanel } from "@/components/ReceiptPanel";
import type { TxReceipt } from "@/lib/genlayer";

const TEMPLATES = [
  { id: "DRUG_NDC", label: "DRUG_NDC", hint: "National Drug Code (10/11-digit exact package identifier)." },
  { id: "DRUG_NAME", label: "DRUG_NAME", hint: "Brand + Generic pair required (brand|generic)." },
  { id: "DEVICE_PRODUCT_CODE", label: "DEVICE_PRODUCT_CODE", hint: "FDA 3–10 character classification code (e.g. FOZ)." },
] as const;

/** Live settle on Studio: fake identity → expected NOHIT after window_end. HIT 3× is pytest, not this NDC. */
function settleWindow(extraHours = 0): { start: string; end: string } {
  const gate = Date.now() + (25 + extraHours) * 3600 * 1000;
  const start = new Date(gate);
  start.setUTCMinutes(0, 0, 0);
  if (start.getTime() < gate) start.setTime(start.getTime() + 3600 * 1000);
  const end = new Date(start.getTime() + 24 * 3600 * 1000);
  const iso = (d: Date) => d.toISOString().replace(/\.\d{3}Z$/, "Z");
  return { start: iso(start), end: iso(end) };
}

const SETTLE_EXAMPLES: {
  title: string;
  expect: string;
  template: (typeof TEMPLATES)[number]["id"];
  product: string;
  premium: string;
  extraHours?: number;
}[] = [
  {
    title: "NOHIT · DRUG_NDC · WALLET A",
    expect: "First wallet. After window_end, anyone settles. Fake NDC → NOHIT. Premium stays in pool.",
    template: "DRUG_NDC",
    product: "00000-0000-00",
    premium: "10",
  },
  {
    title: "NOHIT · DRUG_NDC · WALLET B",
    expect: "Second wallet. Different NDC and later window. Disconnect first, connect the other account, then fill this. Pool still needs ≥20 tGEN available (fund 20 more if reserved).",
    template: "DRUG_NDC",
    product: "11111-2222-22",
    premium: "10",
    extraHours: 24,
  },
  {
    title: "NOHIT · DRUG_NAME · WALLET B/C",
    expect: "Other wallet. Brand|generic with no FDA row. Settle → NOHIT.",
    template: "DRUG_NAME",
    product: "YYYWALLETB|yyywalletbgeneric",
    premium: "10",
    extraHours: 26,
  },
  {
    title: "NOHIT · DEVICE · WALLET C",
    expect: "Third identity. Made-up product code. Do not use a real Class I/II code from the last 30 days.",
    template: "DEVICE_PRODUCT_CODE",
    product: "QQQ",
    premium: "10",
    extraHours: 48,
  },
];

function toIsoUtc(raw: string): string {
  const d = parseUtc(raw);
  if (!d) return raw.trim();
  return d.toISOString().replace(/\.\d{3}Z$/, "Z");
}

export default function BuyPage() {
  const w = useWallet();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [template, setTemplate] = useState<(typeof TEMPLATES)[number]["id"]>("DRUG_NDC");
  const [productKey, setProductKey] = useState("");
  const [startUtc, setStartUtc] = useState("");
  const [endUtc, setEndUtc] = useState("");
  const [premiumStr, setPremiumStr] = useState("100");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<TxReceipt | null>(null);
  const [poolAvail, setPoolAvail] = useState<bigint | null>(null);

  const start = parseUtc(startUtc);
  const end = parseUtc(endUtc);
  const durationDays = start && end ? daysBetween(start, end) : 0;
  const premium = useMemo(() => {
    try {
      return parseGenInput(premiumStr);
    } catch {
      return 0n;
    }
  }, [premiumStr]);
  const reserve = premium * 2n;
  const classI = premium * 3n;
  const classII = premium * 2n;
  const now = new Date();
  const leadOk = start ? now.getTime() <= start.getTime() - 24 * 3600 * 1000 : false;
  const lenOk = durationDays >= 1 && durationDays <= 14 && end && start ? end > start : false;

  function validateKey(): string | null {
    const key = productKey.trim();
    if (!key) return "empty product_key";
    const low = key.toLowerCase();
    if (low.includes("http://") || low.includes("https://") || low.includes("api.fda.gov")) {
      return "buyer cannot pass a URL";
    }
    if (template === "DRUG_NDC") {
      const d = key.replace(/\D/g, "");
      if (d.length < 10 || d.length > 11) return "bad NDC";
    } else if (template === "DRUG_NAME") {
      if (!key.includes("|") && !key.toUpperCase().includes(" AND ")) {
        return "DRUG_NAME requires brand AND generic";
      }
    } else if (!/^[A-Za-z0-9]{3,10}$/.test(key.trim())) {
      return "empty device code";
    }
    return null;
  }

  async function loadPool() {
    if (missingDeployAddress()) return;
    try {
      const e = await get_economics();
      setPoolAvail(BigInt(String(e.pool_available ?? 0)));
    } catch {
      setPoolAvail(null);
    }
  }

  useEffect(() => {
    void loadPool();
    const t = window.setInterval(() => void loadPool(), 8000);
    return () => window.clearInterval(t);
  }, []);

  async function submit() {
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
        setErr(e instanceof Error ? e.message : "Connect a wallet first.");
        return;
      }
    }
    if (!addr || !prov) {
      setErr("Connect a wallet first (header CONNECT WALLET), then seal again.");
      return;
    }
    const vk = validateKey();
    if (vk) {
      setErr(vk);
      return;
    }
    if (!lenOk || !leadOk) {
      setErr("window length 1..14 days and buy before window_start - 24h");
      return;
    }
    if (premium <= 0n) {
      setErr("premium > 0");
      return;
    }
    if (missingDeployAddress()) {
      setErr("deploy address missing");
      return;
    }
    setBusy(true);
    try {
      await loadPool();
      const e = await get_economics();
      const avail = BigInt(String(e.pool_available ?? 0));
      setPoolAvail(avail);
      if (avail < reserve) {
        const ids = await list_ids();
        const last = ids.length ? String(ids[ids.length - 1]) : "";
        setErr(
          last
            ? `pool_available < reserve (available ${formatGen(avail)}, need ${formatGen(reserve)}). A cover is already OPEN: ${last}`
            : `pool_available < reserve (available ${formatGen(avail)}, need ${formatGen(reserve)}). Fund more on /pool.`,
        );
        if (last.startsWith("0x")) router.push(`/cover/${encodeURIComponent(last)}`);
        return;
      }
      const r = await buy_cover(addr as `0x${string}`, prov, {
        template,
        product_key: productKey.trim(),
        window_start_utc: toIsoUtc(startUtc),
        window_end_utc: toIsoUtc(endUtc),
        premium,
      });
      setReceipt(r);
      let cid = r.result != null ? String(r.result) : "";
      if (!cid.startsWith("0x")) {
        const ids = await list_ids();
        cid = ids.length ? String(ids[ids.length - 1]) : "";
      }
      if (cid && cid.startsWith("0x")) router.push(`/cover/${encodeURIComponent(cid)}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
      await loadPool();
    } finally {
      setBusy(false);
    }
  }

  const stepCls = (n: number) =>
    n === step
      ? "border-2 border-on-surface bg-primary text-on-primary p-space-xs flex flex-col justify-between shadow-[2px_2px_0px_#1c1b1b]"
      : n < step
        ? "border border-on-surface bg-surface-container-low p-space-xs flex flex-col justify-between"
        : "border border-on-surface bg-surface-container-highest p-space-xs flex flex-col justify-between opacity-70";

  return (
    <div className="flex flex-col w-full">
      <section className="w-full bg-surface-container-highest px-space-md py-space-sm border-b border-on-surface">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-space-sm font-mono-spec text-mono-spec">
          <div className="flex items-center gap-space-md flex-wrap">
            <span className="flex items-center gap-space-xs font-bold uppercase tracking-wider text-primary">
              <span className="inline-block w-2.5 h-2.5 bg-primary" />
              SYS.STATE // PARAMETRIC WIZARD (STG-0{step})
            </span>
            <span className="text-on-surface-variant">//</span>
            <span className="text-on-surface font-medium">RPC: STUDIO-DEV.GENLAYER.COM/API</span>
          </div>
          <span className="bg-surface-container text-on-surface px-space-xs py-0.5 border border-on-surface font-bold text-label-caps">
            CHASSIS 61997
          </span>
        </div>
      </section>
      <section className="w-full py-space-lg lg:py-space-xl px-space-md lg:px-space-lg">
        <div className="max-w-7xl mx-auto flex flex-col gap-space-lg">
          <div className="border-2 border-on-surface bg-surface-container-lowest p-space-md lg:p-space-lg relative shadow-[4px_4px_0px_#1c1b1b]">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-md pb-space-md border-b-2 border-on-surface">
              <div>
                <div className="flex items-center gap-space-sm mb-space-xs">
                  <span className="bg-on-surface text-surface font-mono-spec text-mono-spec font-bold px-space-xs py-0.5 uppercase tracking-widest">
                    SPECIFICATION MODULE
                  </span>
                  <span className="font-mono-spec text-mono-spec text-primary font-bold">REF // OP-RL-WIZ-01</span>
                </div>
                <h1 className="font-display-hero text-headline-xl lg:text-display-hero uppercase tracking-tighter text-on-surface leading-none">
                  BUY COVER<span className="text-primary tracking-normal">.</span>
                </h1>
                <p className="font-body-md text-body-md text-on-surface-variant mt-space-xs max-w-2xl">
                  Deterministic FDA Recall Parametric Protection Unit. Auto-resolving smart contract infrastructure wired directly into openFDA endpoints via GenLayer Studio Next consensus.
                </p>
              </div>
            </div>
            <div className="pt-space-md grid grid-cols-2 md:grid-cols-5 gap-space-xs font-mono-spec text-mono-spec">
              {[
                ["[01] TEMPLATE", template],
                ["[02] KEY CODE", productKey || "—"],
                ["[03] UTC WINDOW", startUtc ? "SET" : "ACTIVE STEP"],
                ["[04] UNDERWRITE", "PREMIUM LOCK"],
                ["[05] FINALIZE", "SEAL POLICY"],
              ].map((row, i) => (
                <div key={row[0]} className={stepCls(i + 1)}>
                  <div className="flex justify-between items-center text-label-caps font-bold">
                    <span>{row[0]}</span>
                    <span>{i + 1 < step ? "✓" : i + 1 === step ? "BUSY" : "--"}</span>
                  </div>
                  <span className="text-label-caps font-bold truncate mt-1">{row[1]}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
            <div className="lg:col-span-8 flex flex-col gap-space-md">
              <div className="border-2 border-on-surface bg-surface-container-lowest shadow-[3px_3px_0px_#1c1b1b]">
                <div className="bg-on-surface text-surface px-space-md py-space-sm font-mono-spec text-mono-spec font-bold uppercase">
                  [SETTLE EXAMPLES] FILL FORM · 1-DAY WINDOW · START ≥ NOW+25H
                </div>
                <div className="p-space-md grid grid-cols-1 md:grid-cols-2 gap-space-sm">
                  {SETTLE_EXAMPLES.map((ex) => (
                    <button
                      key={ex.title}
                      type="button"
                      className="border border-on-surface bg-surface-container p-space-sm text-left hover:bg-surface-container-high"
                      onClick={() => {
                        const win = settleWindow(ex.extraHours ?? 0);
                        setTemplate(ex.template);
                        setProductKey(ex.product);
                        setStartUtc(win.start);
                        setEndUtc(win.end);
                        setPremiumStr(ex.premium);
                        setStep(4);
                        setErr(null);
                      }}
                    >
                      <div className="font-mono-spec text-mono-spec font-bold uppercase text-primary">{ex.title}</div>
                      <div className="font-mono-spec text-mono-spec mt-1">{ex.product}</div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-space-xs">{ex.expect}</p>
                      <div className="font-mono-spec text-label-caps mt-space-xs font-bold">
                        PREMIUM {ex.premium} tGEN · RESERVE 20 · POOL MUST HOLD ≥20 AVAILABLE
                      </div>
                    </button>
                  ))}
                </div>
                <div className="px-space-md pb-space-md font-mono-spec text-mono-spec text-on-surface-variant">
                  After window_end open the cover and SETTLE. Expected live result for these fakes: NOHIT. HIT 3×/2× is in pytest, not this identity. INSUFFICIENT only if openFDA fails.
                </div>
              </div>
              <div className="border-2 border-on-surface bg-surface-container-low shadow-[3px_3px_0px_#1c1b1b]">
                <div className="bg-surface-container-high px-space-md py-space-sm border-b border-on-surface flex items-center justify-between">
                  <div className="flex items-center gap-space-sm">
                    <span className="bg-on-surface text-surface font-mono-spec text-mono-spec px-space-xs font-bold">[01]</span>
                    <span className="font-headline-md text-headline-md uppercase font-bold tracking-tight">
                      Parametric Template Select
                    </span>
                  </div>
                </div>
                <div className="p-space-md">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-space-sm">
                    {TEMPLATES.map((t) => {
                      const on = template === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setTemplate(t.id);
                            setStep(Math.max(step, 1));
                          }}
                          className={
                            on
                              ? "border-2 border-on-surface bg-secondary-container text-on-secondary-container p-space-sm text-left"
                              : "border border-on-surface bg-surface-container p-space-sm text-left"
                          }
                        >
                          <div className="flex items-center justify-between font-mono-spec text-mono-spec font-bold mb-space-xs">
                            <span>
                              [{on ? "●" : " "}] {t.label}
                            </span>
                            {on ? <span className="text-xs bg-tertiary text-on-tertiary px-1">ACTIVE</span> : null}
                          </div>
                          <p className="font-body-sm text-body-sm leading-snug">{t.hint}</p>
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-space-sm p-space-xs border border-on-surface bg-surface-container font-mono-spec text-label-caps text-on-surface-variant">
                    // RULE: Protocol Multiples (Class I = 3.0x, Class II = 2.0x, Class III or none = NOHIT premium stays) are immutably bound. INSUFFICIENT = 100% refund.
                  </div>
                </div>
              </div>

              <div className="border-2 border-on-surface bg-surface-container-low shadow-[3px_3px_0px_#1c1b1b]">
                <div className="bg-surface-container-high px-space-md py-space-sm border-b border-on-surface">
                  <div className="flex items-center gap-space-sm">
                    <span className="bg-on-surface text-surface font-mono-spec text-mono-spec px-space-xs font-bold">[02]</span>
                    <span className="font-headline-md text-headline-md uppercase font-bold tracking-tight">
                      FDA Product Key Specification
                    </span>
                  </div>
                </div>
                <div className="p-space-md flex flex-col gap-space-sm">
                  <label className="block font-label-caps text-label-caps uppercase text-on-surface font-bold mb-1">
                    TARGET IDENTIFIER
                  </label>
                  <input
                    className="border-2 border-on-surface bg-surface-container-lowest px-space-sm py-2 font-mono-index text-headline-md text-on-surface font-bold tracking-tight outline-none"
                    value={productKey}
                    onChange={(e) => {
                      setProductKey(e.target.value);
                      setStep(Math.max(step, 2));
                    }}
                    placeholder={template === "DRUG_NAME" ? "BRAND|GENERIC" : template === "DEVICE_PRODUCT_CODE" ? "FOZ" : "0069-4210-66"}
                  />
                  <div className="border border-on-surface bg-inverse-surface text-inverse-on-surface p-space-sm font-mono-spec text-mono-spec">
                    Contract constructs the official FDA query. Buyer cannot pass a URL.
                  </div>
                </div>
              </div>

              <div className="border-2 border-on-surface bg-surface-container-lowest shadow-[5px_5px_0px_#af2900]">
                <div className="bg-primary text-on-primary px-space-md py-space-sm flex items-center justify-between border-b-2 border-on-surface">
                  <div className="flex items-center gap-space-sm">
                    <span className="bg-on-surface text-surface font-mono-spec text-mono-spec px-space-xs font-bold">[03]</span>
                    <span className="font-headline-md text-headline-md uppercase font-bold tracking-tight">
                      CONFIGURE UTC COVERAGE WINDOW
                    </span>
                  </div>
                </div>
                <div className="p-space-md lg:p-space-lg flex flex-col gap-space-lg">
                  <div className="border border-on-surface bg-surface-container-low p-space-sm font-body-md text-body-md">
                    <p className="font-bold uppercase tracking-tight text-label-caps text-primary mb-0.5">
                      PARAMETRIC PROTOCOL CONSTRAINTS
                    </p>
                    24h gate. Window 1–14 days. Lookback 30d Class I/II reject. 2x reserve. Class I 3x / Class II 2x / Class III or none NOHIT premium stays / INSUFFICIENT 100% refund.
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                    <div className="border-2 border-on-surface bg-surface p-space-md">
                      <div className="flex justify-between items-center mb-space-xs font-mono-spec text-label-caps uppercase text-on-surface font-bold">
                        <span>[PARAM_01] START TIMESTAMP</span>
                        <span className="text-primary font-bold">UTC SYNC</span>
                      </div>
                      <input
                        className="font-mono-index text-headline-md font-bold text-on-surface bg-surface-container-lowest outline-none w-full border-2 border-on-surface p-space-sm"
                        placeholder="2026-10-01T00:00:00Z"
                        value={startUtc}
                        onChange={(e) => {
                          setStartUtc(e.target.value);
                          setStep(Math.max(step, 3));
                        }}
                      />
                      <div className="mt-space-xs font-mono-spec text-mono-spec">
                        {leadOk ? <span className="text-tertiary font-bold">+24H BUFFER MET</span> : <span className="text-error font-bold">24H GATE</span>}
                      </div>
                    </div>
                    <div className="border-2 border-on-surface bg-surface p-space-md">
                      <div className="flex justify-between items-center mb-space-xs font-mono-spec text-label-caps uppercase text-on-surface font-bold">
                        <span>[PARAM_02] END TIMESTAMP</span>
                        <span className="text-primary font-bold">UTC SYNC</span>
                      </div>
                      <input
                        className="font-mono-index text-headline-md font-bold text-on-surface bg-surface-container-lowest outline-none w-full border-2 border-on-surface p-space-sm"
                        placeholder="2026-10-08T00:00:00Z"
                        value={endUtc}
                        onChange={(e) => setEndUtc(e.target.value)}
                      />
                      <div className="mt-space-xs font-mono-spec text-mono-spec">
                        DURATION: {durationDays ? durationDays.toFixed(2) : "—"} DAYS {lenOk ? "(VALID 1-14D)" : ""}
                      </div>
                    </div>
                  </div>
                  <div className="border border-on-surface bg-surface-container p-space-md">
                    <div className="flex justify-between items-center mb-space-xs font-mono-spec text-label-caps uppercase font-bold text-on-surface">
                      <span>WINDOW STEP RUNNER (DAYS ENCLOSED)</span>
                      <span className="text-primary font-bold">{Math.min(14, Math.max(0, Math.round(durationDays)))} / 14 DAYS MAX</span>
                    </div>
                    <div className="grid grid-cols-14 gap-1 h-6 w-full py-1">
                      {Array.from({ length: 14 }).map((_, i) => (
                        <div
                          key={i}
                          className={
                            i < Math.round(durationDays)
                              ? "bg-primary border border-on-surface h-full"
                              : "bg-surface-container-highest border border-on-surface h-full"
                          }
                        />
                      ))}
                    </div>
                  </div>
                  <div className="pt-space-md border-t-2 border-on-surface flex flex-col sm:flex-row items-center justify-between gap-space-md">
                    <button
                      className="w-full sm:w-auto px-space-md py-space-sm border-2 border-on-surface bg-surface text-on-surface font-mono-spec text-mono-spec font-bold uppercase"
                      type="button"
                      onClick={() => setStep(2)}
                    >
                      ← BACK TO PRODUCT KEY
                    </button>
                    <button
                      className="w-full sm:w-auto px-space-lg py-space-sm border-2 border-on-surface bg-primary text-on-primary font-headline-md text-body-lg uppercase font-bold tracking-tight"
                      type="button"
                      onClick={() => {
                        setStep(4);
                        void loadPool();
                      }}
                    >
                      CONTINUE TO REVIEW & UNDERWRITE
                    </button>
                  </div>
                </div>
              </div>

              {step >= 4 ? (
                <div className="border-2 border-on-surface bg-surface-container-lowest p-space-md">
                  <label className="font-label-caps text-label-caps uppercase font-bold">PREMIUM (tGEN)</label>
                  <input
                    className="w-full border-2 border-on-surface bg-surface-container-low px-space-md py-3 font-mono-index text-headline-md font-bold outline-none mt-space-xs"
                    value={premiumStr}
                    onChange={(e) => setPremiumStr(e.target.value)}
                  />
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void submit()}
                    className="mt-space-md w-full bg-primary hover:bg-primary-container text-on-primary border-2 border-on-surface py-3.5 px-space-md font-headline-md uppercase font-bold shadow-[3px_3px_0px_#1c1b1b] disabled:opacity-50"
                  >
                    {busy ? "SIGNING…" : "SEAL POLICY // BUY COVER"}
                  </button>
                  {poolAvail != null ? (
                    <div className="mt-space-sm font-mono-spec text-mono-spec">
                      POOL AVAILABLE: {formatGen(poolAvail)} · RESERVE NEEDED: {formatGen(reserve)} (2×)
                    </div>
                  ) : null}
                  {err ? (
                    <div className="mt-space-sm font-mono-spec text-mono-spec text-error whitespace-pre-wrap break-all">
                      {err}
                    </div>
                  ) : null}
                  <ReceiptPanel receipt={receipt} />
                </div>
              ) : null}
            </div>

            <div className="lg:col-span-4 flex flex-col gap-space-md">
              <div className="border-2 border-on-surface bg-secondary text-on-secondary p-space-md shadow-[4px_4px_0px_#1c1b1b]">
                <div className="flex items-center justify-between border-b border-secondary-fixed-dim pb-space-sm mb-space-md font-mono-spec text-mono-spec">
                  <span className="font-bold uppercase tracking-wider text-secondary-container">[04] UNDERWRITING BAY</span>
                  <span className="bg-secondary-fixed-dim text-on-secondary-fixed px-space-xs py-0.5 font-bold text-label-caps">
                    PREVIEW
                  </span>
                </div>
                <div className="flex flex-col gap-space-md">
                  <div className="border border-on-secondary p-space-sm">
                    <div className="font-mono-spec text-label-caps uppercase text-secondary-container">CALCULATED PREMIUM</div>
                    <div className="font-mono-index text-headline-xl font-bold tracking-tight">{formatGen(premium)}</div>
                  </div>
                  <div className="border border-on-secondary p-space-sm">
                    <div className="flex justify-between items-center">
                      <span className="font-mono-spec text-label-caps uppercase text-secondary-container">MAX RESERVED PAYOUT</span>
                      <span className="bg-primary text-on-primary text-[10px] font-bold px-1 font-mono-spec">3.0× CAP</span>
                    </div>
                    <div className="font-mono-index text-headline-xl font-bold tracking-tight text-secondary-fixed">
                      {formatGen(classI)}
                    </div>
                    <div className="font-mono-spec text-[11px] text-surface-variant/80 mt-1">
                      Class I: 3.0× ({formatGen(classI)}) // Class II: 2.0× ({formatGen(classII)}) // reserve 2× ({formatGen(reserve)})
                    </div>
                  </div>
                  <div className="border-2 border-tertiary-fixed bg-tertiary-container text-on-tertiary-container p-space-sm font-mono-spec text-mono-spec">
                    <div className="font-bold uppercase text-label-caps mb-1 text-tertiary-fixed">UNDERWRITING COPY</div>
                    <p className="text-[12px] leading-tight">
                      24h gate, 1-14 days, lookback 30d Class I/II reject, 2x reserve, Class I 3x / Class II 2x / Class III or none NOHIT premium stays / INSUFFICIENT 100% refund.
                    </p>
                    {poolAvail != null ? (
                      <p className="text-[12px] mt-1">POOL AVAILABLE: {formatGen(poolAvail)}</p>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="border-2 border-on-surface bg-surface-container-lowest p-space-md shadow-[4px_4px_0px_#1c1b1b]">
                <div className="flex items-center justify-between pb-space-xs border-b border-on-surface mb-space-sm font-mono-spec text-label-caps uppercase font-bold text-on-surface">
                  <span>SYSTEM SCHEMATICS</span>
                  <span className="text-primary">[GENLAYER 61997]</span>
                </div>
                <table className="w-full font-mono-spec text-mono-spec">
                  <tbody>
                    <tr className="border-b border-dotted border-on-surface/40">
                      <td className="py-1 text-on-surface-variant">LOOKBACK CHECK</td>
                      <td className="py-1 text-right font-bold text-tertiary">30D CLASS I/II</td>
                    </tr>
                    <tr className="border-b border-dotted border-on-surface/40">
                      <td className="py-1 text-on-surface-variant">APPEAL PERIOD</td>
                      <td className="py-1 text-right font-bold text-primary">NONE (DETERMINISTIC)</td>
                    </tr>
                    <tr>
                      <td className="py-1 text-on-surface-variant">JURY REQUIREMENT</td>
                      <td className="py-1 text-right font-bold text-on-surface">0 NODES (PURE JSON)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
