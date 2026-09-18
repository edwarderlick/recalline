import * as genlayerChains from "genlayer-js/chains";

export const CHAIN_ID = 61997;
export const CHAIN_ID_HEX = "0xF22D"; // 61997; 0xF21D is 61981 — do not use
export const STUDIO_RPC =
  process.env.NEXT_PUBLIC_STUDIO_RPC || "https://studio-dev.genlayer.com/api";
export const STUDIO_EXPLORER =
  process.env.NEXT_PUBLIC_STUDIO_EXPLORER ||
  "https://explorer-studio-dev.genlayer.com/";
export const CONTRACT_ADDRESS = (
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || ""
).trim();

export const STUDIO_CHAIN = {
  id: CHAIN_ID,
  name: "GenLayer Studio Next",
  nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
  rpcUrls: {
    default: { http: [STUDIO_RPC] as const },
  },
  blockExplorers: {
    default: { name: "Studio Next Explorer", url: STUDIO_EXPLORER },
  },
} as const;

const sdkStudio = (genlayerChains as Record<string, unknown>).studioDevnet as
  | Record<string, unknown>
  | undefined;

/** studioDevnet from genlayer-js; never studionet 61999. */
export const studioDevnet = {
  ...(sdkStudio ?? {}),
  ...STUDIO_CHAIN,
  id: CHAIN_ID,
};

export function isStudioNext(chainId: number | string | null | undefined): boolean {
  if (chainId == null) return false;
  const n =
    typeof chainId === "string"
      ? chainId.startsWith("0x")
        ? parseInt(chainId, 16)
        : Number(chainId)
      : chainId;
  return n === CHAIN_ID;
}

export function missingDeployAddress(): boolean {
  return !CONTRACT_ADDRESS || CONTRACT_ADDRESS === "0x";
}

export function explorerTx(hash: string): string {
  const base = STUDIO_EXPLORER.replace(/\/$/, "");
  return `${base}/tx/${hash}`;
}
