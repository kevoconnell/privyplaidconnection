"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTransactions } from "@/hooks/useTransactions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SignInButton } from "@/components/sign-in-button";
import { PlaidPieChart } from "@/components/ui/pie-chart";

import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from "@heroicons/react/24/outline";
import { usePrivyWithPlaid } from "@/hooks/usePrivyWithPlaid";

export default function TransactionsPage() {
  const router = useRouter();
  const { data, loading, refetch } = useTransactions();
  const { user } = usePrivyWithPlaid();

  // Calculate insights
  const insights = useMemo(() => {
    if (!data?.transactions) {
      return {
        totalIncome: 0,
        totalExpenses: 0,
        netFlow: 0,
        topCategory: null,
        topCategorySpending: 0,
        topCategoryPercentage: "0",
        largestTransaction: null,
        monthlySpending: 0,
        diningSpending: 0,
      };
    }

    const transactions = data.transactions;

    // Calculate income and expenses
    const totalExpenses = transactions
      .filter((tx) => tx.amount > 0)
      .reduce((sum, tx) => sum + tx.amount, 0);

    const totalIncome = transactions
      .filter((tx) => tx.amount < 0)
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

    const netFlow = totalIncome - totalExpenses;

    // Calculate category entries for insights
    const categoryEntries = Object.entries(data.categorySummary || {}).sort(
      (a, b) => Math.abs(b[1].totalAmount) - Math.abs(a[1].totalAmount)
    );

    // Top spending category
    const topCategory = categoryEntries[0];
    const topCategorySpending = topCategory
      ? Math.abs(topCategory[1].totalAmount)
      : 0;
    const topCategoryPercentage =
      totalExpenses > 0
        ? ((topCategorySpending / totalExpenses) * 100).toFixed(1)
        : "0";

    // Largest transaction (by absolute value)
    const largestTransaction = transactions
      .filter((tx) => Math.abs(tx.amount) > 0)
      .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))[0];

    // Current month spending
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlySpending = transactions
      .filter((tx) => {
        const txDate = new Date(tx.date);
        return (
          tx.amount > 0 &&
          txDate.getMonth() === currentMonth &&
          txDate.getFullYear() === currentYear
        );
      })
      .reduce((sum, tx) => sum + tx.amount, 0);

    // Dining spending this month
    const diningSpending = transactions
      .filter((tx) => {
        const txDate = new Date(tx.date);
        return (
          tx.amount > 0 &&
          txDate.getMonth() === currentMonth &&
          txDate.getFullYear() === currentYear &&
          tx.category.some(
            (cat) =>
              cat.toLowerCase().includes("food") ||
              cat.toLowerCase().includes("dining") ||
              cat.toLowerCase().includes("restaurant")
          )
        );
      })
      .reduce((sum, tx) => sum + tx.amount, 0);

    return {
      totalIncome,
      totalExpenses,
      netFlow,
      topCategory: topCategory ? topCategory[0] : null,
      topCategorySpending,
      topCategoryPercentage,
      largestTransaction,
      monthlySpending,
      diningSpending,
    };
  }, [data]);

  //if no user, or no plaid connections
  if (!user || !user.plaid?.connections) {
    //redirect to home page
    router.push("/");
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen text-foreground">
        <header className="mx-auto flex w-full max-w-4xl md:max-w-5xl items-center justify-between px-3 py-4 sm:px-4 sm:py-5 md:py-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center space-x-2 text-secondary hover:text-primary"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              <span>Back</span>
            </Button>
            <h1 className="text-xl font-semibold text-primary">
              Privy + Plaid Financial Insights
            </h1>
          </div>
          <SignInButton />
        </header>
        <div className="mx-auto w-full max-w-5xl px-4 pb-16 pt-10">
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-1/4 mb-4"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-foreground">
      <header className="mx-auto flex w-full max-w-4xl md:max-w-5xl items-center justify-between px-3 py-4 sm:px-4 sm:py-5 md:py-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/")}
            className="flex items-center space-x-2 text-secondary hover:text-primary"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span>Home</span>
          </Button>
        </div>
        <div className="flex items-center space-x-4">
          <SignInButton />
        </div>
      </header>

      <section className="flex-1">
        <div className="mx-auto w-full max-w-5xl px-4 pb-16 pt-10 justify-center">
          <div className="mb-10 text-left">
            <h1 className="text-3xl font-semibold leading-tight text-primary md:text-4xl">
              Your Financial Insights with{" "}
              <span className="text-privy">Privy</span> + Plaid
            </h1>
          </div>

          {/* Spending Analysis */}
          <div className="mb-8">
            <div className="flex flex-col gap-6 md:flex-row lg:items-stretch">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                {/* Pie Chart */}
                <PlaidPieChart
                  title="Spending by Category"
                  description="Breakdown of your expenses"
                  data={
                    data?.categorySummary
                      ? Object.entries(data.categorySummary)
                          .filter(([_, summary]) => summary.totalAmount > 0)
                          .sort(
                            ([_, a], [__, b]) => b.totalAmount - a.totalAmount
                          )
                          .slice(0, 8)
                          .map(([category, summary], index) => ({
                            category,
                            amount: summary.totalAmount,
                            fill: `hsl(${(index * 45) % 360}, 70%, 50%)`,
                            label: category,
                            name: category,
                          }))
                      : []
                  }
                  dataKey="amount"
                  labelKey="label"
                  showInnerRadius={true}
                  innerRadius={40}
                  strokeWidth={8}
                  footerContent={
                    <>
                      <div className="text-center">
                        <p className="text-secondary">Total Spending</p>
                        <p className="text-2xl font-bold text-primary">
                          ${insights.totalExpenses.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-center text-sm text-secondary">
                        {data?.categorySummary
                          ? Object.keys(data.categorySummary).length
                          : 0}{" "}
                        categories
                      </div>
                    </>
                  }
                  className="w-full max-w-md mx-auto"
                />

                {/* Flow Details */}
                <div className="flex-1 space-y-4">
                  <div className="rounded-3xl border backdrop-blur-xl surface-card p-5">
                    <div className="flex items-center space-x-3">
                      <ArrowTrendingUpIcon className="w-8 h-8 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-secondary">
                          Money In
                        </p>
                        <p className="text-2xl font-bold text-green-600">
                          ${insights.totalIncome.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border backdrop-blur-xl surface-card p-5">
                    <div className="flex items-center space-x-3">
                      <ArrowTrendingDownIcon className="w-8 h-8 text-red-600" />
                      <div>
                        <p className="text-sm font-medium text-secondary">
                          Money Out
                        </p>
                        <p className="text-2xl font-bold text-red-600">
                          ${insights.totalExpenses.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border backdrop-blur-xl surface-card p-5">
                    <div className="flex items-center space-x-3">
                      {insights.netFlow >= 0 ? (
                        <ArrowTrendingUpIcon className="w-8 h-8 text-green-600" />
                      ) : (
                        <ArrowTrendingDownIcon className="w-8 h-8 text-red-600" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-secondary">
                          Net Flow
                        </p>
                        <p
                          className={`text-2xl font-bold ${
                            insights.netFlow >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          ${insights.netFlow.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
