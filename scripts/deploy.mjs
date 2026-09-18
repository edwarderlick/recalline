/**
 * Deploy contracts/recallline.py to Studio Next (61997).
 * Usage: node scripts/deploy.mjs
 * Requires GenLayer CLI 0.40 RC on PATH, network studio-dev, funded keystore.
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rpc = process.env.GENLAYER_STUDIO_URL || "https://studio-dev.genlayer.com/api";
const args = [
  "deploy",
  "--contract",
  "contracts/recallline.py",
  "--fee-profile",
  "fee-profile.json",
  "--rpc",
  rpc,
];
const r = spawnSync("genlayer", args, { cwd: root, stdio: "inherit", shell: true });
process.exit(r.status ?? 1);
