import { useState } from "react";
import { Copy, Check, CreditCard, Info } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/Button";
import { mockWallet } from "../lib/mockData";

export function FundWallet() {
  const [copied, setCopied] = useState(false);

  function copyAccountNumber() {
    navigator.clipboard.writeText(mockWallet.accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="app-shell">
      <PageHeader title="Fund Wallet" />

      <div className="flex-1 px-5 pb-8 space-y-5">
        <div>
          <p className="text-sm font-semibold text-ink mb-3">Your Dedicated Account</p>
          <p className="text-xs text-ink-soft mb-4 leading-relaxed">
            Transfer only from your bank account using the details below.
          </p>

          <div className="bg-gradient-to-br from-nexzee to-nexzee-dark rounded-card p-5 text-white">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard size={18} />
              <span className="text-sm font-semibold">{mockWallet.bankName}</span>
            </div>
            <p className="text-xs text-white/70 mb-1">Account Name</p>
            <p className="text-sm font-semibold mb-4">{mockWallet.accountName}</p>
            <p className="text-xs text-white/70 mb-1">Account Number</p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-extrabold tracking-wide">{mockWallet.accountNumber}</p>
              <button
                onClick={copyAccountNumber}
                className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-nexzee-soft rounded-card p-4 flex gap-3">
          <Info size={18} className="text-nexzee shrink-0 mt-0.5" />
          <p className="text-xs text-nexzee leading-relaxed">
            After payment, your wallet will be credited automatically.
          </p>
        </div>

        <button className="text-sm text-nexzee font-semibold w-full text-center py-2">
          View Funding History
        </button>

        <div className="pt-2">
          <p className="text-sm font-semibold text-ink mb-3">Or fund with card</p>
          <Button variant="secondary">
            <CreditCard size={18} />
            Fund with Card
          </Button>
        </div>

        <div className="bg-card rounded-card shadow-card p-4">
          <p className="text-xs font-semibold text-ink mb-2">Important Notes</p>
          <ul className="text-xs text-ink-soft space-y-1.5 list-disc list-inside">
            <li>Transfer must be from your registered bank account.</li>
            <li>Do not transfer from a different account or your payment may fail.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
