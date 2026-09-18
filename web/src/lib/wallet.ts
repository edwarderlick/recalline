"use client";

import { CHAIN_ID, CHAIN_ID_HEX, STUDIO_EXPLORER, STUDIO_RPC } from "./network";

export type Eip1193Provider = {
  request: (args: { method: string; params?: unknown[] | object }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
};

export type AnnouncedProvider = {
  info: {
    uuid: string;
    name: string;
    icon?: string;
    rdns?: string;
  };
  provider: Eip1193Provider;
};

const LAST_ADDR_KEY = "recallline.lastAddress";
const LAST_UUID_KEY = "recallline.lastProviderUuid";

const announced = new Map<string, AnnouncedProvider>();
let listening6963 = false;

function ensure6963(): void {
  if (typeof window === "undefined") return;
  if (!listening6963) {
    listening6963 = true;
    window.addEventListener("eip6963:announceProvider", ((event: Event) => {
      const detail = (event as CustomEvent).detail as AnnouncedProvider | undefined;
      if (detail?.info?.uuid && detail.provider) {
        announced.set(detail.info.uuid, detail);
      }
    }) as EventListener);
  }
  window.dispatchEvent(new Event("eip6963:requestProvider"));
}

function injectedName(p: Eip1193Provider & Record<string, unknown>): string {
  if (p.isRabby) return "Rabby";
  if (p.isOkxWallet || p.isOKExWallet) return "OKX Wallet";
  if (p.isCoinbaseWallet) return "Coinbase Wallet";
  if (p.isBraveWallet) return "Brave Wallet";
  if (p.isPhantom) return "Phantom";
  if (p.isTrust || p.isTrustWallet) return "Trust Wallet";
  if (p.isTokenPocket) return "TokenPocket";
  if (p.isBitKeep || p.isBitgetWallet) return "Bitget Wallet";
  if (p.isFrame) return "Frame";
  if (p.isRainbow) return "Rainbow";
  if (p.isMetaMask) return "MetaMask";
  return "Injected wallet";
}

function scrapeLegacyInjected(): void {
  if (typeof window === "undefined") return;
  const eth = window.ethereum as (Eip1193Provider & { providers?: Eip1193Provider[] }) | undefined;
  const bag: Eip1193Provider[] = [];
  if (eth?.providers && Array.isArray(eth.providers)) bag.push(...eth.providers);
  else if (eth) bag.push(eth);
  for (const raw of bag) {
    const p = raw as Eip1193Provider & Record<string, unknown>;
    const already = Array.from(announced.values()).some((a) => a.provider === raw);
    if (already) continue;
    const name = injectedName(p);
    const meta = p as { rdns?: string; providerInfo?: { uuid?: string } };
    const uuid = String(meta.rdns || meta.providerInfo?.uuid || `legacy:${name}`);
    if (!announced.has(uuid)) {
      announced.set(uuid, { info: { uuid, name }, provider: raw });
    }
  }
}

export function listProviders(): AnnouncedProvider[] {
  ensure6963();
  scrapeLegacyInjected();
  return Array.from(announced.values());
}

export function getInjectedProvider(): Eip1193Provider | null {
  ensure6963();
  const last = typeof window !== "undefined" ? localStorage.getItem(LAST_UUID_KEY) : null;
  if (last && announced.has(last)) return announced.get(last)!.provider;
  const list = listProviders();
  if (list.length === 1) return list[0].provider;
  if (typeof window !== "undefined" && window.ethereum) {
    return window.ethereum as Eip1193Provider;
  }
  return list[0]?.provider ?? null;
}

export function persistLastAddress(address: string | null): void {
  if (typeof window === "undefined") return;
  if (address) localStorage.setItem(LAST_ADDR_KEY, address);
  else localStorage.removeItem(LAST_ADDR_KEY);
}

export function readLastAddress(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LAST_ADDR_KEY);
}

export async function requestAccounts(provider: Eip1193Provider): Promise<string[]> {
  const accs = (await provider.request({ method: "eth_requestAccounts" })) as string[];
  if (accs?.[0]) persistLastAddress(accs[0]);
  return accs || [];
}

export async function getAccounts(provider: Eip1193Provider): Promise<string[]> {
  try {
    const accs = (await provider.request({ method: "eth_accounts" })) as string[];
    return accs || [];
  } catch {
    return [];
  }
}

export async function getChainId(provider: Eip1193Provider): Promise<number> {
  const hex = (await provider.request({ method: "eth_chainId" })) as string;
  return parseInt(hex, 16);
}

export async function getBalanceWei(
  provider: Eip1193Provider,
  address: string,
): Promise<bigint> {
  const hex = (await provider.request({
    method: "eth_getBalance",
    params: [address, "latest"],
  })) as string;
  return BigInt(hex);
}

export async function switchToStudioNext(provider: Eip1193Provider): Promise<void> {
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: CHAIN_ID_HEX }],
    });
  } catch (err: unknown) {
    const code = (err as { code?: number })?.code;
    if (code === 4902 || code === -32603) {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: CHAIN_ID_HEX,
            chainName: "GenLayer Studio Next",
            nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
            rpcUrls: [STUDIO_RPC],
            blockExplorerUrls: [STUDIO_EXPLORER],
          },
        ],
      });
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: CHAIN_ID_HEX }],
      });
      return;
    }
    throw err;
  }
}

export function pickProvider(uuid?: string): Eip1193Provider | null {
  ensure6963();
  if (uuid && announced.has(uuid)) {
    localStorage.setItem(LAST_UUID_KEY, uuid);
    return announced.get(uuid)!.provider;
  }
  return getInjectedProvider();
}

export function watchProvider(
  provider: Eip1193Provider,
  handlers: {
    accountsChanged?: (accounts: string[]) => void;
    chainChanged?: (chainId: string) => void;
  },
): () => void {
  const onAcc = (...args: unknown[]) => {
    const accounts = (args[0] as string[]) || [];
    persistLastAddress(accounts[0] ?? null);
    handlers.accountsChanged?.(accounts);
  };
  const onChain = (...args: unknown[]) => {
    handlers.chainChanged?.(String(args[0] ?? ""));
  };
  provider.on?.("accountsChanged", onAcc);
  provider.on?.("chainChanged", onChain);
  return () => {
    provider.removeListener?.("accountsChanged", onAcc);
    provider.removeListener?.("chainChanged", onChain);
  };
}

declare global {
  interface Window {
    ethereum?: Eip1193Provider;
  }
}

void CHAIN_ID;
