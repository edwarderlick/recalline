/**
 * Prints expected outcomes for tests/fixtures/*.json. HIT is proven in direct tests.
 * Live buys must use a future window (lookback rejects recent Class I/II).
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = path.join(root, "tests", "fixtures");
const expected = {
  "class_i_ndc.json": "HIT Class I → 3× premium to buyer; pool_deposited -= 2× premium",
  "class_ii_ndc.json": "HIT Class II → 2× premium to buyer; pool_deposited -= 1× premium",
  "class_iii_ndc.json": "NOHIT; premium stays in pool; reserve released",
  "empty.json": "NOHIT (no match) or lookback empty (buy allowed)",
  "lookback_class_i.json": "buy_cover reverts lookback Class I/II",
  "missing_meta.json": "INSUFFICIENT; 100% premium refund; reserve released",
  "ten_rows_early_hit.json": "HIT from an earlier row among 10 results, not only the last",
  "wrong_ndc.json": "NOHIT (identity mismatch), never HIT",
};

for (const f of readdirSync(dir)) {
  if (!f.endsWith(".json")) continue;
  const n = JSON.parse(readFileSync(path.join(dir, f), "utf8"));
  const nres = Array.isArray(n.results) ? n.results.length : "n/a";
  console.log(`${f}\trows=${nres}\t${expected[f] || "(see tests/direct)"}`);
}
