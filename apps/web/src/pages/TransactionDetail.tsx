import { useEffect, useState, ReactNode } from "react";
import { useParams } from "react-router-dom";
import { Copy, Check } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge } from "../components/StatusBadge";
import { api } from "../api/client";
import { WalletTransaction } from "../lib/useWallet";

interface OrderItem {
  key: string;
  value: string;
}

interface TransactionDetail extends WalletTransaction {
  order?: {
    reference: string;
    type: string;
    items: OrderItem[];
    providerTx?: { providerReference: string | null; status: string | null } | null;
  } | null;
}

function formatNaira(n: number) {
  return `₦${n.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Turns raw order item keys like "mobile_number" into "Mobile Number"
function humanizeKey(key: string) {
  return key
    .split("_")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

export function TransactionDetailPage() {
  const { reference } = useParams<{ reference: string }>();
  const [tx, setTx] = useState<TransactionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!reference) return;
    api
      .get(`/wallet/transactions/${encodeURIComponent(reference)}`)
      .then((res) => setTx(res.data.data))
      .catch(() => setError("Transaction not found."))
      .finally(() => setLoading(false));
  }, [reference]);

  function copyReference() {
    if (!tx) return;
    navigator.clipboard.writeText(tx.reference);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="app-shell">
        <PageHeader title="Transaction" />
        <div className="px-5 pt-6 space-y-3">
          <div className="h-32 bg-ink/5 rounded-card animate-pulse" />
          <div className="h-24 bg-ink/5 rounded-card animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !tx) {
    return (
      <div className="app-shell">
        <PageHeader title="Transaction" />
        <div className="flex-1 flex items-center justify-center px-8 text-center">
          <p className="text-sm text-ink-soft">{error || "Something went wrong."}</p>
        </div>
      </div>
    );
  }

  const isCredit = Number(tx.balanceAfter) >= Number(tx.balanceBefore);
  const amount = Number(tx.amount);

  return (
    <div className="app-shell">
      <PageHeader title="Transaction" />

      <div className="flex-1 px-5 pb-8 space-y-4">
        <div className="bg-card rounded-card shadow-card p-5 text-center">
          <p className={`text-3xl font-extrabold ${isCredit ? "text-success" : "text-ink"}`}>
            {isCredit ? "+" : "-"}
            {formatNaira(amount)}
          </p>
          <p className="text-sm text-ink-soft mt-1">{tx.description || tx.type}</p>
          <div className="flex justify-center mt-3">
            <StatusBadge status={tx.status.toLowerCase()} />
          </div>
        </div>

        <div className="bg-card rounded-card shadow-card divide-y divide-ink/5">
          <Row label="Reference">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-ink">{tx.reference}</span>
              <button onClick={copyReference} className="text-ink-faint">
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
          </Row>
          <Row label="Date">
            <span className="text-sm font-medium text-ink">{formatDateTime(tx.createdAt)}</span>
          </Row>
          <Row label="Balance Before">
            <span className="text-sm font-medium text-ink">
              {formatNaira(Number(tx.balanceBefore))}
            </span>
          </Row>
          <Row label="Balance After">
            <span className="text-sm font-medium text-ink">
              {formatNaira(Number(tx.balanceAfter))}
            </span>
          </Row>
        </div>

        {tx.order && tx.order.items.length > 0 && (
          <div className="bg-card rounded-card shadow-card divide-y divide-ink/5">
            <p className="text-xs font-semibold text-ink-soft px-4 pt-3 pb-1">Order Details</p>
            {tx.order.items.map((item) => (
              <Row key={item.key} label={humanizeKey(item.key)}>
                <span className="text-sm font-medium text-ink">{item.value}</span>
              </Row>
            ))}
            {tx.order.providerTx?.providerReference && (
              <Row label="Provider Reference">
                <span className="text-sm font-medium text-ink">
                  {tx.order.providerTx.providerReference}
                </span>
              </Row>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-sm text-ink-soft">{label}</span>
      {children}
    </div>
  );
}
