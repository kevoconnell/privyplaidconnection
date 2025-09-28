"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAtomValue } from "jotai";

import { FloatingControls } from "@/components/ui/floating-controls";
import { usePrivyWithPlaid } from "@/hooks/usePrivyWithPlaid";
import { plaidStatusAtom } from "@/store/plaid";
import { ConnectionStatusCard } from "@/components/ui/connection-status-card";
import { StepCard } from "@/components/ui/step-card";
import { SignInButton } from "@/components/sign-in-button";
import Header from "@/components/ui/header";

export default function PlaidLinkPage() {
  const router = useRouter();

  const { linkPlaid, unlinkPlaid, authenticated, ready, login, user } =
    usePrivyWithPlaid();
  const plaidUser = user?.plaid;

  const plaidStatus = useAtomValue(plaidStatusAtom);
  const step = useMemo(() => {
    if (!authenticated) {
      return 1;
    }

    if (!plaidUser?.connections || !plaidUser?.connections.length) {
      return 2;
    }

    return 3;
  }, [authenticated, plaidUser]);

  // TODO: Move this to a separate hook with a atom to track current step
  const {
    stepLabel,
    stepSubtitle,
    headline,
    bodyCopy,
    primaryCtaLabel,
    supplementalNote,
  } = useMemo(() => {
    switch (step) {
      case 1:
        return {
          stepLabel: "Step 1",
          stepSubtitle: "Sign in",
          headline: (
            <>
              Create a crypto wallet with{" "}
              <span className="text-privy">Privy</span>
            </>
          ),
          bodyCopy:
            "Privy manages authentication so you can focus on building your fintech app.",
          primaryCtaLabel: "Sign in with Privy",
          supplementalNote: "",
        };
      case 2:
        return {
          stepLabel: "Step 2",
          stepSubtitle: "Connect",
          headline: "Connect your financial institutions with Plaid",
          bodyCopy:
            "Plaid allows you to connect your financial institutions with your Privy app.",
          primaryCtaLabel: "Connect with Plaid",
          supplementalNote:
            'Tap "Continue as Guest", pick Huntington, and use user_good / pass_good to finish.',
        };
      default:
        return {
          stepLabel: "Step 3",
          stepSubtitle: "Done",
          headline: (
            <>
              You now have connected <span className="text-privy">Privy</span> +
              Plaid
            </>
          ),
          bodyCopy: "Use this to get financial data for your fintech app.",
          primaryCtaLabel: "View your linked accounts",
          supplementalNote:
            "Use the unlink option anytime if you want to restart the Privy + Plaid flow.",
        };
    }
  }, [step]);

  const linkingDisabled = useMemo(() => {
    if (step === 1 || step === 3) {
      return false;
    }

    return (
      !ready ||
      !plaidUser?.linkToken ||
      plaidStatus.fetchingLinkToken ||
      plaidStatus.linking
    );
  }, [
    plaidStatus.fetchingLinkToken,
    plaidStatus.linking,
    plaidUser?.linkToken,
    ready,
    step,
  ]);

  const primaryButtonLabel = useMemo(() => {
    if (step === 2) {
      if (plaidStatus.fetchingLinkToken) {
        return "Preparing Plaid…";
      }

      if (plaidStatus.linking) {
        return "Opening Plaid…";
      }
    }

    return primaryCtaLabel;
  }, [
    plaidStatus.fetchingLinkToken,
    plaidStatus.linking,
    primaryCtaLabel,
    step,
  ]);

  const handlePrimaryCta = async () => {
    if (step === 1) {
      await login();
      return;
    }

    if (step === 2) {
      await linkPlaid();
      return;
    }

    router.push("/plaid/redirect");
  };

  return (
    <>
      <main className="flex min-h-screen flex-col px-10 text-foreground">
        <Header />

        <section className="flex-1">
          <div className="mx-auto w-full max-w-5xl px-4 pb-16 pt-10">
            <div className="mb-10 text-left">
              <h1 className="text-3xl font-semibold leading-tight text-primary md:text-4xl">
                Link a bank in seconds using{" "}
                <span className="text-privy">Privy</span> + Plaid
              </h1>
            </div>

            <div
              key={`step-${step}`}
              className="flex flex-col gap-6 md:flex-row lg:items-stretch"
            >
              <StepCard
                stepLabel={stepLabel}
                stepSubtitle={stepSubtitle}
                headline={headline}
                body={bodyCopy}
                supplementalNote={supplementalNote || undefined}
                primaryAction={
                  step === 3
                    ? {
                        label: "View Transactions",
                        onClick: () => router.push("/transactions"),
                        disabled: false,
                      }
                    : {
                        label: primaryButtonLabel,
                        onClick: handlePrimaryCta,
                        disabled: linkingDisabled,
                      }
                }
                secondaryAction={
                  step === 3 && plaidUser?.connections.length
                    ? {
                        label: "Unlink Plaid",
                        onClick: unlinkPlaid,
                      }
                    : undefined
                }
              />

              <ConnectionStatusCard
                plaidStatus={plaidStatus}
                plaidUser={plaidUser ?? null}
              />
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
