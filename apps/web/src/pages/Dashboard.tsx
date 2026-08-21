import { useNavigate } from "react-router-dom";
import { Bell, Eye, EyeOff, Wifi, Phone, Tv, Zap as ZapIcon } from "lucide-react";
import { useState } from "react";
import { BottomNav } from "../components/BottomNav";
import { TransactionRow } from "../components/TransactionRow";
import { useWallet } from "../lib/useWallet";
import { useAuth } from "../context/AuthContext";

const quickActions = [
  { icon: Wifi, label: "Data", to: "/buy-data" },
  { icon: Phone, label: "Airtime", to: "/airtime" },
  { icon: Tv, label: "Cable TV", to: "/dashboard" },
  { icon: ZapIcon, label: "Electricity", to: "/dashboard" },
];

function formatNaira(n: number) {
  return `₦${n.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
}

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { balance, transactions, loading } = useWallet();
  const [showBalance, setShowBalance] = useState(true);
  const firstName = user?.fullName?.split(" ")[0] ?? "there";

  return (
    <div className="app-shell">
      <div className="flex-1 pb-24">
        {/* Header */}
        <header className="bg-nexzee text-white px-5 pt-6 pb-16 rounded-b-[2rem]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-lg font-bold">Hello, {firstName} 👋</p>
              <p className="text-white/70 text-xs mt-0.5">Welcome back!</p>
            </div>
            <button className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
              <Bell size={18} />
            </button>
          </div>
        </header>

        {/* Wallet card - overlapping header */}
        <div className="px-5 -mt-12">
          <div className="bg-card rounded-card shadow-card p-5">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-ink-soft font-medium">Wallet Balance</p>
              <button onClick={() => setShowBalance((s) => !s)} className="text-ink-faint">
                {showBalance ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </div>
            <p className="text-3xl font-extrabold text-ink mb-4">
              {loading ? (
                <span className="inline-block w-32 h-8 bg-ink/5 rounded-lg animate-pulse" />
              ) : showBalance ? (
                formatNaira(balance ?? 0)
              ) : (
                "₦••••••"
              )}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => navigate("/fund-wallet")}
                className="flex-1 h-11 rounded-xl bg-nexzee text-white text-sm font-semibold active:scale-[0.98] transition-transform"
              >
                Fund Wallet
              </button>
              <button
                onClick={() => navigate("/buy-data")}
                className="flex-1 h-11 rounded-xl bg-nexzee-soft text-nexzee text-sm font-semibold active:scale-[0.98] transition-transform"
              >
                Buy Data
              </button>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="px-5 mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-ink">Quick Actions</h2>
            <button className="text-xs text-nexzee font-semibold">See All</button>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {quickActions.map(({ icon: Icon, label, to }) => (
              <button
                key={label}
                onClick={() => navigate(to)}
                className="flex flex-col items-center gap-2"
              >
                <div className="w-14 h-14 rounded-2xl bg-card shadow-card flex items-center justify-center text-nexzee">
                  <Icon size={22} />
                </div>
                <span className="text-[11px] font-medium text-ink-soft">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent transactions */}
        <div className="px-5 mt-7">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-bold text-ink">Recent Transactions</h2>
            <button onClick={() => navigate("/transactions")} className="text-xs text-nexzee font-semibold">
              See All
            </button>
          </div>
          {loading ? (
            <div className="bg-card rounded-card shadow-card p-4 space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-12 bg-ink/5 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="bg-card rounded-card shadow-card p-6 text-center">
              <p className="text-sm text-ink-soft">No transactions yet. Fund your wallet to get started.</p>
            </div>
          ) : (
            <div className="bg-card rounded-card shadow-card px-4 divide-y divide-ink/5">
              {transactions.slice(0, 3).map((tx) => (
                <TransactionRow key={tx.id} tx={tx} />
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
