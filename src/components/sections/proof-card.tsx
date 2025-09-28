"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ShieldCheckIcon,
  KeyIcon,
  DocumentDuplicateIcon,
} from "@heroicons/react/24/outline";
import { TransactionsResponse } from "@/hooks/useTransactions";
import { CryptoProof } from "@/utils/crypto-proof";

interface VerificationResult {
  isValid: boolean;
  signatureValid: boolean;
  categorySpending: number;
  thresholdMet: boolean;
}

interface ProofCardProps {
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  threshold: number;
  setThreshold: (threshold: number) => void;
  data: TransactionsResponse | null;
  generatedProof: CryptoProof | null;
  proofLoading: boolean;
  verificationResult: VerificationResult | null;
  generateSpendingProof: () => void;
  verifyProof: () => void;
}

export function ProofCard({
  selectedCategory,
  setSelectedCategory,
  threshold,
  setThreshold,
  data,
  generatedProof,
  proofLoading,
  verificationResult,
  generateSpendingProof,
  verifyProof,
}: ProofCardProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };
  return (
    <div className="rounded-3xl border backdrop-blur-xl surface-card p-6 min-h-full">
      {data && (
        <>
          <div className="flex items-center space-x-3 mb-4">
            <ShieldCheckIcon className="w-6 h-6 text-privy" />
            <h3 className="text-xl font-semibold text-primary">
              Category Spending Proof
            </h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left Column - Form Subcard */}
            <div className="rounded-2xl border bg-background/50 backdrop-blur-sm p-4">
              <div className="flex items-center space-x-2 mb-4">
                <ShieldCheckIcon className="w-5 h-5 text-privy" />
                <h4 className="text-lg font-semibold text-primary">
                  Generate Proof
                </h4>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border bg-background text-foreground"
                  >
                    {data?.categorySummary ? (
                      Object.keys(data.categorySummary).map((category) => (
                        <option key={category} value={category}>
                          {category.replace(/_/g, " ")}
                        </option>
                      ))
                    ) : (
                      <option value="Food and Drink">Food and Drink</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">
                    Threshold Amount ($)
                  </label>
                  <input
                    type="number"
                    value={threshold === 0 ? "" : threshold}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "") {
                        setThreshold(0);
                      } else {
                        setThreshold(Number(value));
                      }
                    }}
                    placeholder="100"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 rounded-lg border bg-background text-foreground"
                  />
                </div>

                <div className="p-3 bg-muted/50 rounded-lg text-sm text-secondary space-y-1">
                  <p>
                    <strong>Category:</strong>{" "}
                    {selectedCategory.replace(/_/g, " ")}
                  </p>
                  <p>
                    <strong>Threshold:</strong> ${threshold.toFixed(2)}
                  </p>
                  <p>
                    <strong>Actual Spending:</strong> $
                    {data?.categorySummary?.[selectedCategory]
                      ? data.categorySummary[
                          selectedCategory
                        ].totalAmount.toFixed(2)
                      : "0.00"}
                  </p>
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={generateSpendingProof}
                    disabled={
                      proofLoading ||
                      threshold === 0 ||
                      !data?.categorySummary?.[selectedCategory] ||
                      data.categorySummary[selectedCategory].totalAmount <
                        threshold
                    }
                    className="button-primary w-full"
                  >
                    {proofLoading ? "Generating..." : "Generate Proof"}
                  </Button>

                  {generatedProof && (
                    <Button
                      onClick={verifyProof}
                      className="button-secondary w-full"
                    >
                      Verify Proof
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Proof Display Subcard */}
            <div className="rounded-2xl border bg-background/50 backdrop-blur-sm p-4">
              <div className="flex items-center space-x-2 mb-4">
                <KeyIcon className="w-5 h-5 text-privy" />
                <h4 className="text-lg font-semibold text-primary">
                  Generated Proof
                </h4>
              </div>

              {generatedProof ? (
                <div className="space-y-3">
                  {/* Proof Details */}
                  <div className="rounded-lg border bg-background/30 p-3">
                    <h5 className="text-xs font-medium text-secondary mb-2">
                      Cryptographic Details
                    </h5>
                    <div className="grid grid-cols-2 gap-1">
                      <div
                        className="relative p-1.5 bg-muted/50 rounded text-xs min-w-0 overflow-hidden cursor-pointer hover:bg-muted/70 transition-colors"
                        onClick={() =>
                          copyToClipboard(
                            generatedProof.commitment,
                            "commitment"
                          )
                        }
                        title="Click to copy full commitment"
                      >
                        {copiedField === "commitment" ? (
                          <span className="text-green-500 ml-1 absolute top-1 right-1">
                            ✓
                          </span>
                        ) : (
                          <DocumentDuplicateIcon className="absolute top-1 right-1 w-3 h-3 text-secondary" />
                        )}

                        <p className="text-secondary mb-0.5 text-xs">
                          Commitment
                        </p>
                        <p className="font-mono break-all text-xs">
                          {generatedProof.commitment.slice(0, 10)}...
                        </p>
                      </div>

                      <div
                        className="relative p-1.5 bg-muted/50 rounded text-xs min-w-0 overflow-hidden cursor-pointer hover:bg-muted/70 transition-colors"
                        onClick={() =>
                          copyToClipboard(generatedProof.signature, "signature")
                        }
                        title="Click to copy full signature"
                      >
                        {copiedField === "signature" ? (
                          <span className="text-green-500 ml-1 absolute top-1 right-1">
                            ✓
                          </span>
                        ) : (
                          <DocumentDuplicateIcon className="absolute top-1 right-1 w-3 h-3 text-secondary" />
                        )}
                        <p className="text-secondary mb-0.5 text-xs">
                          Signature
                        </p>
                        <p className="font-mono break-all text-xs">
                          {generatedProof.signature.slice(0, 10)}...
                        </p>
                      </div>

                      <div
                        className="relative p-1.5 bg-muted/50 rounded text-xs min-w-0 overflow-hidden cursor-pointer hover:bg-muted/70 transition-colors"
                        onClick={() =>
                          copyToClipboard(generatedProof.publicKey, "publicKey")
                        }
                        title="Click to copy full public key"
                      >
                        {copiedField === "publicKey" ? (
                          <span className="text-green-500 ml-1 absolute top-1 right-1">
                            ✓
                          </span>
                        ) : (
                          <DocumentDuplicateIcon className="absolute top-1 right-1 w-3 h-3 text-secondary" />
                        )}
                        <p className="text-secondary mb-0.5 text-xs">
                          Public Key
                        </p>
                        <p className="font-mono break-all text-xs">
                          {generatedProof.publicKey.slice(0, 10)}...
                        </p>
                      </div>

                      <div
                        className="relative p-1.5 bg-muted/50 rounded text-xs min-w-0 overflow-hidden cursor-pointer hover:bg-muted/70 transition-colors"
                        onClick={() =>
                          copyToClipboard(
                            generatedProof.walletAddress || "",
                            "wallet"
                          )
                        }
                        title="Click to copy wallet address"
                      >
                        {copiedField === "wallet" ? (
                          <span className="text-green-500 ml-1 absolute top-1 right-1">
                            ✓
                          </span>
                        ) : (
                          <DocumentDuplicateIcon className="absolute top-1 right-1 w-3 h-3 text-secondary " />
                        )}
                        <p className="text-secondary mb-0.5 text-xs">Wallet</p>
                        <p className="font-mono break-all text-xs">
                          {generatedProof.walletAddress?.slice(0, 10)}...
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Spending Details */}
                  <div className="rounded-lg border bg-background/30 p-3">
                    <h5 className="text-xs font-medium text-secondary mb-2">
                      Spending Details
                    </h5>
                    <div className="grid grid-cols-2 gap-1 text-xs min-w-0">
                      <div className="p-1.5 bg-muted/50 rounded min-w-0 overflow-hidden">
                        <p className="text-secondary mb-0.5 text-xs">
                          Category
                        </p>
                        <p className="font-medium text-xs break-words">
                          {selectedCategory.replace(/_/g, " ")}
                        </p>
                      </div>
                      <div className="p-1.5 bg-muted/50 rounded min-w-0 overflow-hidden">
                        <p className="text-secondary mb-0.5 text-xs">
                          Threshold
                        </p>
                        <p className="font-medium text-xs">
                          ${generatedProof.range[0]}
                        </p>
                      </div>
                      <div className="p-1.5 bg-muted/50 rounded min-w-0 overflow-hidden">
                        <p className="text-secondary mb-0.5 text-xs">
                          Spending
                        </p>
                        <p className="font-medium text-xs">
                          ${generatedProof.value.toFixed(2)}
                        </p>
                      </div>
                      <div className="p-1.5 bg-muted/50 rounded min-w-0 overflow-hidden">
                        <p className="text-secondary mb-0.5 text-xs">Range</p>
                        <p className="font-medium text-xs break-words">
                          ${generatedProof.range[0]} - $
                          {generatedProof.range[1]}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Verification Result */}
                  {verificationResult && (
                    <div className="rounded-lg border bg-background/30 p-3">
                      <h5 className="text-xs font-medium text-secondary mb-2">
                        Verification Result
                      </h5>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              verificationResult.isValid
                                ? "bg-green-500"
                                : "bg-red-500"
                            }`}
                          />
                          <span className="text-xs font-medium">
                            {verificationResult.isValid
                              ? "Valid Proof"
                              : "Invalid Proof"}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              verificationResult.signatureValid
                                ? "bg-green-500"
                                : "bg-red-500"
                            }`}
                          />
                          <span className="text-xs font-medium">
                            {verificationResult.signatureValid
                              ? "Valid Signature"
                              : "Invalid Signature"}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              verificationResult.thresholdMet
                                ? "bg-green-500"
                                : "bg-red-500"
                            }`}
                          />
                          <span className="text-xs font-medium">
                            {verificationResult.thresholdMet
                              ? `Threshold Met ($${verificationResult.categorySpending.toFixed(
                                  2
                                )})`
                              : `Threshold Not Met ($${verificationResult.categorySpending.toFixed(
                                  2
                                )})`}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-secondary text-sm">
                    No proof generated yet
                  </p>
                  <p className="text-xs text-secondary mt-1">
                    Generate a proof to see cryptographic commitment
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
