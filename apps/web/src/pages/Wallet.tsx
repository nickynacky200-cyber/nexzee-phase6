import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Clock, Building2, History, Gift, Headphones, ChevronRight } from "lucide-react";
import { useState } from "react";
import { BottomNav } from "../components/BottomNav";
import { useWallet } from "../lib/useWallet";

function formatNaira(n: number) {
  return `₦${n.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
}

const links = [
  { icon: Clock, label: "Wallet History", to: "/transactions" },
  { icon: Building2, label: "Funding Accounts", to: "/fund-wallet" },
  { icon: History, label: "Withdrawal History", to: "/transactions" },
  { icon: Gift, label: "Refer & Earn", to: "/wallet" },
];

export function Wallet() {
  const navigate = useNavigate();
  const { balance, loading } = useWallet();
  const [showBalance, setShowBalance] = useState(true);

  return (
    <div className="app-shell">
      <div className="flex-1 pb-24">
        <header className="px-5 pt-6 pb-4">
          <h1 className="text-lg font-bold text-ink">Wallet</h1>
        </header>

        <div className="px-5">
          <div className="bg-gradient-to-br from-nexzee to-nexzee-dark rounded-card p-5 text-white">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-white/70 font-medium">Wallet Balance</p>
              <button onClick={() => setShowBalance((s) => !s)} className="text-white/80">
                {showBalance ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </div>
            <p className="text-3xl font-extrabold mb-4">
              {loading ? (
                <span className="inline-block w-32 h-8 bg-white/15 rounded-lg animate-pulse" />
              ) : showBalance ? (
                formatNaira(balance ?? 0)
              ) : (
                "₦••••••"
              )}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => navigate("/fund-wallet")}
                className="flex-1 h-11 rounded-xl bg-white text-nexzee text-sm font-semibold active:scale-[0.98] transition-transform"
              >
                Fund Wallet
              </button>
              <button className="flex-1 h-11 rounded-xl bg-white/15 text-white text-sm font-semibold active:scale-[0.98] transition-transform">
                Withdraw
              </button>
            </div>
          </div>
        </div>

        <div className="px-5 mt-6">
          <div className="bg-card rounded-card shadow-card divide-y divide-ink/5">
            {links.map(({ icon: Icon, label, to }) => (
              <button
                key={label}
                onClick={() => navigate(to)}
                className="w-full flex items-center gap-3 px-4 py-3.5"
              >
                <div className="w-9 h-9 rounded-full bg-nexzee-soft flex items-center justify-center text-nexzee shrink-0">
                  <Icon size={17} />
                </div>
                <span className="flex-1 text-left text-sm font-medium text-ink">{label}</span>
                <ChevronRight size={16} className="text-ink-faint" />
              </button>
            ))}
          </div>
        </div>

        <div className="px-5 mt-6">
          <div className="bg-nexzee-soft rounded-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-nexzee flex items-center justify-center text-white shrink-0">
              <Headphones size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">Need help?</p>
              <p className="text-xs text-ink-soft">Contact our support team</p>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
