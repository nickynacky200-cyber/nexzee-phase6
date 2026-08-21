import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { WalletTransaction } from "../lib/useWallet";
import { StatusBadge } from "./StatusBadge";

function formatNaira(n: number) {
  return `₦${n.toLocaleString("en-NG", { minimumFractionDigits: 0 })}`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" });
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" });
}

const typeLabels: Record<WalletTransaction["type"], string> = {
  DEPOSIT: "Wallet Funding",
  PURCHASE: "Purchase",
  REFUND: "Refund",
  ADJUSTMENT: "Wallet Adjustment",
};

export function TransactionRow({ tx }: { tx: WalletTransaction }) {
  const navigate = useNavigate();
  const isCredit = Number(tx.balanceAfter) >= Number(tx.balanceBefore);
  const amount = Number(tx.amount);

  return (
    <button
      onClick={() => navigate(`/transactions/${encodeURIComponent(tx.reference)}`)}
      className="w-full flex items-center gap-3 py-3 text-left"
    >
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
          isCredit ? "bg-success/10 text-success" : "bg-nexzee-soft text-nexzee"
        }`}
      >
        {isCredit ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-ink truncate">
          {tx.description || typeLabels[tx.type]}
        </p>
        <p className="text-xs text-ink-faint mt-0.5">
          {formatDate(tx.createdAt)} • {formatTime(tx.createdAt)}
        </p>
      </div>

      <div className="text-right shrink-0">
        <p className={`text-sm font-bold ${isCredit ? "text-success" : "text-ink"}`}>
          {isCredit ? "+" : "-"}
          {formatNaira(amount)}
        </p>
        <div className="mt-1">
          <StatusBadge status={tx.status.toLowerCase()} />
        </div>
      </div>
    </button>
  );
}
