/**
 * View/balance checks against the live Studio Next contract. Not UI text.
 * Usage: node scripts/verify_payout.mjs
 */
import { createClient } from "genlayer-js";
import { studioDevnet } from "genlayer-js/chains";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envLocal = path.join(root, "web", ".env.local");
const envText = readFileSync(envLocal, "utf8");
const addr = (envText.match(/NEXT_PUBLIC_CONTRACT_ADDRESS=(.+)/) || [])[1]?.trim();
if (!addr) {
  console.error("missing NEXT_PUBLIC_CONTRACT_ADDRESS in web/.env.local");
  process.exit(1);
}

const rpc = "https://studio-dev.genlayer.com/api";
const chain = { ...studioDevnet, id: 61997, rpcUrls: { default: { http: [rpc] } } };
const client = createClient({ chain });

function isOk(tx) {
  const st = String(tx?.statusName || tx?.status || "");
  const ex = String(tx?.txExecutionResultName || "");
  return (st.includes("ACCEPTED") || st.includes("FINALIZED") || st.includes("Accepted")) &&
    ex === "FINISHED_WITH_RETURN";
}

async function main() {
  const eco = await client.readContract({
    address: addr,
    functionName: "get_economics",
    args: [],
  });
  const ids = await client.readContract({
    address: addr,
    functionName: "list_ids",
    args: [],
  });
  const ids2 = await client.readContract({
    address: addr,
    functionName: "get_cover_ids",
    args: [],
  });
  console.log(JSON.stringify({
    address: addr,
    chainId: 61997,
    rpc,
    economics: eco,
    list_ids: ids,
    get_cover_ids: ids2,
    list_ids_eq: JSON.stringify(ids) === JSON.stringify(ids2),
    treasury_is_zero: Number(eco?.treasury ?? eco?.treasury) === 0 || eco?.treasury === 0n || String(eco?.treasury) === "0",
  }, (_, v) => (typeof v === "bigint" ? v.toString() : v), 2));
  if (JSON.stringify(ids) !== JSON.stringify(ids2)) {
    throw new Error("list_ids != get_cover_ids");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
