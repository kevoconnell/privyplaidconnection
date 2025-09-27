"use client";

import { useState, useEffect } from "react";
import { useIdentityToken } from "@privy-io/react-auth";

export interface Transaction {
  id: string;
  plaidTransactionId: string;
  accountId: string;
  accountName?: string;
  amount: number;
  isoCurrencyCode?: string;
  date: string;
  authorizedDate?: string;
  name: string;
  merchantName?: string;
  pending: boolean;
  category: string[];
  createdAt: string;
  formattedAmount: string;
}

export interface CategorySummary {
  count: number;
  totalAmount: number;
  transactions: Transaction[];
}

export interface TransactionsResponse {
  transactions: Transaction[];
  categorySummary: Record<string, CategorySummary>;
  totalCount: number;
  dateRange: {
    from?: string;
    to?: string;
  };
}

export function useTransactions() {
  const [data, setData] = useState<TransactionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { identityToken } = useIdentityToken();

  const fetchTransactions = async () => {
    if (!identityToken || data) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/transactions", {
        headers: {
          "privy-id-token": identityToken,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch transactions");
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [identityToken]);

  return {
    data,
    loading,
    error,
    refetch: fetchTransactions,
  };
}
