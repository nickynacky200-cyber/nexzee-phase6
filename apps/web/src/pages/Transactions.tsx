import { useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { TransactionRow } from "../components/TransactionRow";
import { BottomNav } from "../components/BottomNav";
import { Button } from "../components/Button";
import { useTransactions, TransactionCategory } from "../lib/useTransactions";

const filters: { key: TransactionCategory; label: string }[] = [
  { key: "all", label: "All" },
  { key: "funding", label: "Funding" },
  { key: "data", label: "Data" },
  { key: "airtime", label: "Airtime" },
  { key: "refund", label: "Refund" },
  { key: "other", label: "Other" },
];

export function Transactions() {
  const [active, setActive] = useState<TransactionCategory>("all");
  const { items, loading, loadingMore, hasMore, loadMore } = useTransactions(active);

  return (
    <div className="app-shell">
      <PageHeader title="Transactions" />

      <div className="px-5 pb-3 bg-card">
        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setActive(f.key)}
              className={`shrink-0 px-4 h-9 rounded-pill text-sm font-semibold transition-colors ${
                active === f.key ? "bg-nexzee text-white" : "bg-nexzee-soft text-nexzee"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 px-5 pb-24 pt-2">
        {loading ? (
          <div className="bg-card rounded-card shadow-card p-4 space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-ink/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-ink-soft">No transactions in this category yet.</p>
          </div>
        ) : (
          <>
            <div className="bg-card rounded-card shadow-card px-4 divide-y divide-ink/5">
              {items.map((tx) => (
                <TransactionRow key={tx.id} tx={tx} />
              ))}
            </div>
            {hasMore && (
              <div className="mt-4">
                <Button variant="ghost" onClick={loadMore} loading={loadingMore}>
                  Load More
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
