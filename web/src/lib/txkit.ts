"use client";

import { createTransactionKit } from "@genlayer/transaction-kit";
import feeProfile from "../../fee-profile.json";
import { studioDevnet } from "./network";
import type { Eip1193Provider } from "./wallet";

/** Optional transaction-kit handle; writes still pass estimateTransactionFees unchanged. */
export function makeKit(account: `0x${string}`, provider: Eip1193Provider) {
  return createTransactionKit({
    chain: studioDevnet as never,
    provider,
    account,
    suggestions: feeProfile,
  });
}
