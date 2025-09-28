import { NextRequest, NextResponse } from "next/server";
import db from "@/initalizers/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { proofType, value, min, max, category, transactionId } = body;

    // Validate required fields
    if (!min || !max || min >= max) {
      return NextResponse.json(
        { error: "Valid min and max values are required" },
        { status: 400 }
      );
    }

    // Return the data needed for client-side proof generation
    let proofData;

    switch (proofType) {
      case "spending":
        if (!category || !value) {
          return NextResponse.json(
            { error: "Category and value are required for spending proofs" },
            { status: 400 }
          );
        }
        proofData = {
          type: "spending",
          category,
          value,
          min,
          max,
        };
        break;

      case "transaction":
        if (!transactionId || !value) {
          return NextResponse.json(
            {
              error:
                "TransactionId and value are required for transaction proofs",
            },
            { status: 400 }
          );
        }
        proofData = {
          type: "transaction",
          transactionId,
          value,
          min,
          max,
        };
        break;

      case "simple":
      default:
        if (!value) {
          return NextResponse.json(
            { error: "Value is required for simple proofs" },
            { status: 400 }
          );
        }
        proofData = {
          type: "simple",
          value,
          min,
          max,
        };
        break;
    }

    return NextResponse.json({
      proofData,
      message: "Use this data to generate proof client-side",
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error preparing proof data:", error);
    return NextResponse.json(
      { error: "Failed to prepare proof data" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get user's transactions for proof generation
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Fetch user's transactions
    const transactions = await db.query.plaidConnections.findMany({
      where: (connections, { eq }) => eq(connections.userId, userId),
      with: {
        transactions: {
          orderBy: (transactions, { desc }) => [desc(transactions.date)],
        },
      },
    });

    const allTransactions = transactions.flatMap((conn) =>
      conn.transactions.map((tx) => ({
        id: tx.id,
        amount: parseFloat(tx.amount || "0"),
        category: tx.category?.map((c) => c.replace(/_/g, " ")) || [],
        date: tx.date,
        name: tx.name,
      }))
    );

    // Calculate spending by category
    const categorySummary = allTransactions.reduce((acc, tx) => {
      const category =
        tx.category && tx.category.length > 0
          ? tx.category[0]
          : "Uncategorized";
      if (!acc[category]) {
        acc[category] = { totalAmount: 0, count: 0 };
      }
      acc[category].totalAmount += tx.amount;
      acc[category].count += 1;
      return acc;
    }, {} as Record<string, { totalAmount: number; count: number }>);

    const totalSpending = allTransactions
      .filter((tx) => tx.amount > 0)
      .reduce((sum, tx) => sum + tx.amount, 0);

    const totalIncome = allTransactions
      .filter((tx) => tx.amount < 0)
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

    return NextResponse.json({
      transactions: allTransactions,
      categorySummary,
      totalSpending,
      totalIncome,
      transactionCount: allTransactions.length,
    });
  } catch (error) {
    console.error("Error fetching transactions for proofs:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}
