"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTransactions } from "@/hooks/useTransactions";
import { PlaidPieChart } from "@/components/ui/plaid-pie-chart";
import { ProofCard } from "@/components/sections/proof-card";
import {
  type CryptoProof,
  signAttestation,
  type AttestationMessage,
  verifyAttestation,
} from "@/utils/crypto-proof";

import { usePrivyWithPlaid } from "@/hooks/usePrivyWithPlaid";
import Header from "@/components/ui/header";
import { useEffect } from "react";
import { useSignTypedData } from "@privy-io/react-auth";

export default function TransactionsPage() {
  const router = useRouter();
  const { data } = useTransactions();
  const { user, ready } = usePrivyWithPlaid();
  const { signTypedData } = useSignTypedData();

  const [selectedCategory, setSelectedCategory] = useState(
    data?.categorySummary && Object.keys(data.categorySummary).length > 0
      ? Object.keys(data.categorySummary)[0]
      : "Food and Drink"
  );
  const [threshold, setThreshold] = useState(10);

  useEffect(() => {
    if (data?.categorySummary && Object.keys(data.categorySummary).length > 0) {
      setSelectedCategory(Object.keys(data.categorySummary)[0]);
    }
  }, [data]);

  const [generatedProof, setGeneratedProof] = useState<CryptoProof | null>(
    null
  );
  const [proofLoading, setProofLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    isValid: boolean;
    signatureValid: boolean;
    categorySpending: number;
    thresholdMet: boolean;
  } | null>(null);

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

    const totalExpenses = transactions
      .filter((tx) => tx.amount > 0)
      .reduce((sum, tx) => sum + tx.amount, 0);

    const totalIncome = transactions
      .filter((tx) => tx.amount < 0)
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

    return {
      totalIncome,
      totalExpenses,
    };
  }, [data]);

  // Generate category spending proof (client-side)
  const generateSpendingProof = async () => {
    if (!user?.wallet?.address) {
      alert("Please connect your wallet first");
      return;
    }

    if (!data?.categorySummary) {
      alert("No spending data available");
      return;
    }

    // Find the selected category spending
    const categoryData = data.categorySummary[selectedCategory];
    if (!categoryData) {
      alert(`No data found for category: ${selectedCategory}`);
      return;
    }

    const categorySpending = categoryData.totalAmount;

    setProofLoading(true);
    try {
      const thresholdInCents = threshold * 100;
      // Generate attestation message
      const message = await signAttestation(
        data.transactions,
        selectedCategory,
        thresholdInCents
      );

      // Sign the attestation with Privy
      const { signature } = await signTypedData({
        domain: {
          name: "PlaidAttestation",
          version: "1",
        },
        types: {
          Attestation: [
            { name: "schema", type: "string" },
            { name: "aud", type: "string" },
            { name: "nonce", type: "bytes32" },
            { name: "issuedAt", type: "uint64" },
            { name: "expiresAt", type: "uint64" },
            { name: "plaidRoot", type: "bytes32" },
            { name: "valueCents", type: "uint256" },
            { name: "predicate", type: "string" },
          ],
        },
        primaryType: "Attestation",
        message: message as any,
      });

      setGeneratedProof({
        attestation: message,
        signature: typeof signature === "string" ? signature : signature,
        walletAddress: user.wallet.address,
        commitment: message.plaidRoot,
        publicKey: user.wallet.address,
        range: [thresholdInCents / 100, categorySpending] as [number, number],
        value: categorySpending,
        message: `Spending proof for ${selectedCategory}`,
      });
      setVerificationResult(null);
    } catch (error) {
      console.error("Failed to generate proof:", error);

      // Check if the error is due to user cancellation
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (
        errorMessage.includes("User rejected") ||
        errorMessage.includes("User denied") ||
        errorMessage.includes("cancelled") ||
        errorMessage.includes("canceled") ||
        errorMessage.includes("rejected")
      ) {
        // User cancelled the signing - don't show error, just log it
      } else {
        // Show error for other types of failures
        alert("Failed to generate proof");
      }
    } finally {
      setProofLoading(false);
    }
  };

  const verifyProof = async () => {
    if (!generatedProof || !data?.categorySummary || !data?.transactions)
      return;

    try {
      const result = await verifyAttestation({
        address: generatedProof.walletAddress as `0x${string}`,
        signature: generatedProof.signature as `0x${string}`,
        message: generatedProof.attestation as AttestationMessage,
        transactions: data.transactions,
        category: selectedCategory,
      });

      const categoryData = data.categorySummary[selectedCategory];
      setVerificationResult({
        isValid: result.ok,
        signatureValid: result.ok,
        categorySpending: categoryData?.totalAmount || 0,
        thresholdMet: (categoryData?.totalAmount || 0) >= threshold,
      });
    } catch (error) {
      console.error("Failed to verify proof:", error);
      alert("Failed to verify proof");
    }
  };

  if (ready && (!user || !user.plaid?.connections)) {
    router.push("/");
    return null;
  }

  return (
    <div className="min-h-screen text-foreground px-10">
      <Header />
      {data ? (
        <section className="flex-1">
          <div className="mx-auto w-full pb-16 pt-10 justify-center">
            {/* Main Content Grid */}
            <div className="mb-5">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                {/* Spending Analysis */}
                <div className="flex flex-col">
                  <div className="mb-4">
                    <h2 className="text-2xl font-semibold leading-tight text-primary mb-2">
                      Real-time financial insights
                    </h2>
                    <p className="text-base leading-7 text-secondary">
                      Access live transaction data and spending analytics from
                      connected bank accounts.
                    </p>
                  </div>

                  <div className="flex-1">
                    <PlaidPieChart
                      title="Your Bank account spending by Category"
                      description="Breakdown of your expenses"
                      data={
                        data?.categorySummary
                          ? Object.entries(data.categorySummary)
                              .sort(
                                ([, a], [, b]) => b.totalAmount - a.totalAmount
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
                      strokeWidth={10}
                      footerContent={
                        data?.categorySummary && (
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
                        )
                      }
                      className="w-full h-full"
                    />
                  </div>
                </div>

                {/* Proof Generation */}
                <div className="flex flex-col">
                  <div className="mb-4">
                    <h2 className="text-2xl font-semibold leading-tight text-primary mb-2">
                      Generate cryptographic proofs from real bank data.
                    </h2>
                    <p className="text-base leading-7 text-secondary">
                      Perfect for building applications that need to verify
                      financial behavior.
                    </p>
                  </div>

                  <div className="flex-1">
                    <ProofCard
                      selectedCategory={selectedCategory}
                      setSelectedCategory={setSelectedCategory}
                      threshold={threshold}
                      setThreshold={setThreshold}
                      data={data}
                      generatedProof={generatedProof}
                      proofLoading={proofLoading}
                      verificationResult={verificationResult}
                      generateSpendingProof={generateSpendingProof}
                      verifyProof={verifyProof}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-3">
            <div
              className="rounded-full h-12 w-12 border-2 border-gray-300 border-t-blue-500"
              style={{ animation: "spin 1s linear infinite" }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
}
