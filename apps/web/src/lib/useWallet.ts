import { useEffect, useState, useCallback } from "react";
import { api } from "../api/client";

export interface WalletTransaction {
  id: string;
  type: "DEPOSIT" | "PURCHASE" | "REFUND" | "ADJUSTMENT";
  amount: string;
  balanceBefore: string;
  balanceAfter: string;
  reference: string;
  status: "PENDING" | "SUCCESSFUL" | "FAILED" | "REFUNDED";
  description: string | null;
  createdAt: string;
}

export function useWallet() {
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [walletRes, txRes] = await Promise.all([
        api.get("/wallet"),
        api.get("/wallet/transactions"),
      ]);
      setBalance(Number(walletRes.data.data.balance));
      setTransactions(txRes.data.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { balance, transactions, loading, refresh };
}
