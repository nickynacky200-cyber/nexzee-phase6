import { useEffect, useState, useCallback } from "react";
import { api } from "../api/client";
import { WalletTransaction } from "./useWallet";

export type TransactionCategory = "all" | "funding" | "data" | "airtime" | "refund" | "other";

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function useTransactions(category: TransactionCategory) {
  const [items, setItems] = useState<WalletTransaction[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPage = useCallback(
    async (page: number, append: boolean) => {
      append ? setLoadingMore(true) : setLoading(true);
      try {
        const res = await api.get("/wallet/transactions", {
          params: { type: category, page, limit: 20 },
        });
        setItems((prev) => (append ? [...prev, ...res.data.data] : res.data.data));
        setPagination(res.data.pagination);
      } finally {
        append ? setLoadingMore(false) : setLoading(false);
      }
    },
    [category]
  );

  // Reset and refetch from page 1 whenever the filter category changes.
  useEffect(() => {
    fetchPage(1, false);
  }, [fetchPage]);

  function loadMore() {
    if (!pagination || pagination.page >= pagination.totalPages || loadingMore) return;
    fetchPage(pagination.page + 1, true);
  }

  const hasMore = pagination ? pagination.page < pagination.totalPages : false;

  return { items, loading, loadingMore, hasMore, loadMore };
}
