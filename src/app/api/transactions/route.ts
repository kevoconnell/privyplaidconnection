import { NextRequest, NextResponse } from "next/server";
import db from "@/initalizers/db";
import privy from "@/initalizers/privy";
import {
  transactions,
  plaidConnections,
} from "@/initalizers/db/drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { Transaction } from "@/hooks/useTransactions";
import { assert } from "node:console";
import { authenticatePrivyUser } from "@/utils/privy";

export async function GET(request: NextRequest) {
  try {
    // Verify Privy token
    const privyUser = await authenticatePrivyUser(request);

    const userId = privyUser?.id ?? "";

    const userConnections = await db
      .select()
      .from(plaidConnections)
      .where(eq(plaidConnections.userId, userId));

    if (userConnections.length === 0) {
      return NextResponse.json({
        transactions: [],
        message: "No connected accounts found",
      });
    }

    const dbTransactions = await db
      .select()
      .from(transactions)
      .innerJoin(
        plaidConnections,
        eq(transactions.plaidConnectionId, plaidConnections.id)
      )
      .where(eq(plaidConnections.userId, userId))
      .orderBy(desc(transactions.date), desc(transactions.createdAt));

    const categorizedTransactions = dbTransactions.map(
      (tx): Transaction => ({
        id: tx.transactions.id,
        plaidTransactionId: tx.transactions.plaidTransactionId,
        accountId: tx.transactions.accountId,
        accountName: tx.transactions.accountName || undefined,
        amount: parseFloat(tx.transactions.amount || "0"),
        isoCurrencyCode: tx.transactions.isoCurrencyCode || undefined,
        date: tx.transactions.date,
        authorizedDate: tx.transactions.authorizedDate || undefined,
        name: tx.transactions.name,
        merchantName: tx.transactions.merchantName || undefined,
        pending: tx.transactions.pending,
        category:
          tx.transactions.category?.map((c) => c.replace(/_/g, " ")) || [],
        createdAt: tx.transactions.createdAt,
        formattedAmount: new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: tx.transactions.isoCurrencyCode || "USD",
        }).format(parseFloat(tx.transactions.amount || "0")),
      })
    );

    // Group transactions by category for summary
    const categorySummary = categorizedTransactions.reduce(
      (
        acc: Record<
          string,
          { count: number; totalAmount: number; transactions: Transaction[] }
        >,
        tx: (typeof categorizedTransactions)[number]
      ) => {
        const category =
          tx.category && tx.category.length > 0
            ? tx.category[0]
            : "Uncategorized";
        if (!acc[category]) {
          acc[category] = {
            count: 0,
            totalAmount: 0,
            transactions: [],
          };
        }
        acc[category].count += 1;
        acc[category].totalAmount += tx.amount;
        acc[category].transactions.push(tx);
        return acc;
      },
      {} as Record<
        string,
        { count: number; totalAmount: number; transactions: Transaction[] }
      >
    );

    const filteredCategories = Object.fromEntries(
      Object.entries(categorySummary).filter(
        ([_, category]: [string, { totalAmount: number }]) =>
          category.totalAmount > 0
      )
    );

    return NextResponse.json({
      transactions: categorizedTransactions,
      categorySummary: filteredCategories,
      totalCount: categorizedTransactions.length,
      dateRange: {
        from: categorizedTransactions[categorizedTransactions.length - 1]?.date,
        to: categorizedTransactions[0]?.date,
      },
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}
