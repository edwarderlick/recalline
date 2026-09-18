import { formatGen } from "@/lib/format";
import type { TxReceipt } from "@/lib/genlayer";

export function ReceiptPanel({ receipt }: { receipt: TxReceipt | null }) {
  if (!receipt) return null;
  const has =
    receipt.deposit != null || receipt.consumedFee != null || receipt.refund != null;
  if (!has) return null;
  return (
    <div className="border border-on-surface bg-surface-container-low p-space-sm font-mono-spec text-mono-spec flex flex-col gap-1">
      <span className="font-label-caps text-label-caps uppercase font-bold text-on-surface">
        FEE RECEIPT
      </span>
      <div className="flex justify-between">
        <span className="text-on-surface-variant">DEPOSIT</span>
        <span className="font-bold">{formatGen(receipt.deposit ?? 0)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-on-surface-variant">CONSUMED FEE</span>
        <span className="font-bold">{formatGen(receipt.consumedFee ?? 0)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-on-surface-variant">REFUND</span>
        <span className="font-bold">{formatGen(receipt.refund ?? 0)}</span>
      </div>
    </div>
  );
}
