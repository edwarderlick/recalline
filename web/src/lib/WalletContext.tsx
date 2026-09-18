"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { get_credit, withdraw } from "./contract";
import { missingDeployAddress } from "./network";
import {
  getAccounts,
  getBalanceWei,
  getChainId,
  listProviders,
  pickProvider,
  requestAccounts,
  switchToStudioNext,
  watchProvider,
  type AnnouncedProvider,
  type Eip1193Provider,
} from "./wallet";

type WalletState = {
  provider: Eip1193Provider | null;
  providers: AnnouncedProvider[];
  address: string | null;
  chainId: number | null;
  balanceWei: bigint;
  credits: bigint;
  connecting: boolean;
  error: string | null;
  connect: (uuid?: string) => Promise<{ address: string | null; provider: Eip1193Provider | null }>;
  disconnect: () => void;
  switchNetwork: () => Promise<void>;
  refresh: () => Promise<void>;
  doWithdraw: () => Promise<void>;
};

const Ctx = createContext<WalletState | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [provider, setProvider] = useState<Eip1193Provider | null>(null);
  const [providers, setProviders] = useState<AnnouncedProvider[]>([]);
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [balanceWei, setBalanceWei] = useState(0n);
  const [credits, setCredits] = useState(0n);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const p = provider;
    if (!p || !address) {
      setBalanceWei(0n);
      setCredits(0n);
      return;
    }
    try {
      const [cid, bal] = await Promise.all([getChainId(p), getBalanceWei(p, address)]);
      setChainId(cid);
      setBalanceWei(bal);
    } catch {
      /* ignore */
    }
    if (!missingDeployAddress()) {
      try {
        setCredits(await get_credit(address));
      } catch {
        /* keep last known credit; do not zero on a read blip */
      }
    }
  }, [provider, address]);

  const connect = useCallback(async (uuid?: string) => {
    setConnecting(true);
    setError(null);
    try {
      const list = listProviders();
      setProviders(list);
      if (list.length > 1 && !uuid) {
        setConnecting(false);
        return { address: null, provider: null };
      }
      const p = pickProvider(uuid);
      if (!p) {
        throw new Error(
          "No browser wallet found. Install MetaMask, Rabby, Coinbase Wallet, Brave, or OKX — or open this site inside that wallet’s in-app browser.",
        );
      }
      const accs = await requestAccounts(p);
      const addr = accs[0] ?? null;
      setProvider(p);
      setAddress(addr);
      try {
        await switchToStudioNext(p);
      } catch {
        /* SWITCH TO 61997 banner remains */
      }
      try {
        setChainId(await getChainId(p));
      } catch {
        setChainId(null);
      }
      return { address: addr, provider: p };
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      throw e;
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setProvider(null);
    setAddress(null);
    setChainId(null);
    setBalanceWei(0n);
    setCredits(0n);
  }, []);

  const switchNetwork = useCallback(async () => {
    if (!provider) return;
    await switchToStudioNext(provider);
    setChainId(await getChainId(provider));
  }, [provider]);

  const doWithdraw = useCallback(async () => {
    if (!provider || !address) throw new Error("connect wallet");
    await withdraw(address as `0x${string}`, provider);
    await refresh();
  }, [provider, address, refresh]);

  useEffect(() => {
    const t = window.setTimeout(() => setProviders(listProviders()), 200);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = listProviders();
      if (!cancelled) setProviders(list);
      const p = pickProvider();
      if (!p) return;
      try {
        const accs = await getAccounts(p);
        if (cancelled || !accs[0]) return;
        setProvider(p);
        setAddress(accs[0]);
        try {
          setChainId(await getChainId(p));
        } catch {
          /* ignore */
        }
      } catch {
        /* not authorized yet */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!provider) return;
    return watchProvider(provider, {
      accountsChanged: (accs) => setAddress(accs[0] ?? null),
      chainChanged: (id) => setChainId(parseInt(String(id), 16)),
    });
  }, [provider]);

  useEffect(() => {
    void refresh();
    if (!address) return;
    const t = window.setInterval(() => void refresh(), 8000);
    return () => window.clearInterval(t);
  }, [refresh, address]);

  const value = useMemo(
    () => ({
      provider,
      providers,
      address,
      chainId,
      balanceWei,
      credits,
      connecting,
      error,
      connect,
      disconnect,
      switchNetwork,
      refresh,
      doWithdraw,
    }),
    [
      provider,
      providers,
      address,
      chainId,
      balanceWei,
      credits,
      connecting,
      error,
      connect,
      disconnect,
      switchNetwork,
      refresh,
      doWithdraw,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWallet(): WalletState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useWallet requires WalletProvider");
  return v;
}
