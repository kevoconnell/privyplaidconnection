import { GlassCard } from "./glass-card";
import { usePrivyWithPlaid } from "@/hooks/usePrivyWithPlaid";
import { plaidStatusAtom } from "@/store/plaid";
import { useAtom } from "jotai";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

interface StepAction {
  label: string;
  onClick: () => void | Promise<void>;
  disabled?: boolean;
}

interface StepCardProps {
  step: number;
}

export function StepCard({ step }: StepCardProps) {
  const { login, linkPlaid, unlinkPlaid, ready, user } = usePrivyWithPlaid();
  const [plaidStatus] = useAtom(plaidStatusAtom);
  const router = useRouter();
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
          headline: "Connect your bank with Plaid",
          bodyCopy:
            "Plaid allows you to connect your financial institutions with your Privy app.",
          primaryCtaLabel: "Connect with Plaid",
          supplementalNote:
            'Tap "Continue as Guest", pick Regions Bank, and use user_good / pass_good to finish.',
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
          primaryCtaLabel: "View Transactions",
          supplementalNote:
            "Use the unlink option anytime if you want to restart the Privy + Plaid flow.",
        };
    }
  }, [step]);

  const handlePrimaryCta = async () => {
    if (step === 1) {
      await login();
      return;
    }

    if (step === 2) {
      await linkPlaid();
      return;
    }

    router.push("/transactions");
  };

  const linkingDisabled = useMemo(() => {
    if (step === 1 || step === 3) {
      return false;
    }

    return (
      !ready ||
      !user?.plaid?.linkToken ||
      plaidStatus.fetchingLinkToken ||
      plaidStatus.linking
    );
  }, [
    plaidStatus.fetchingLinkToken,
    plaidStatus.linking,
    user?.plaid?.linkToken,
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

  return (
    <GlassCard className="flex h-full  flex-1 flex-col gap-4 p-5 text-left text-secondary lg:col-span-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="tag">{stepLabel}</span>
        <span className="text-sm text-secondary">{stepSubtitle}</span>
      </div>

      <div className="space-y-3">
        <h2 className="text-4xl font-semibold leading-snug text-primary md:text-5xl">
          {headline}
        </h2>
        <div className="max-w-xl text-base leading-7 text-secondary">
          {bodyCopy}
        </div>
        {supplementalNote ? (
          <div className="text-sm text-secondary">{supplementalNote}</div>
        ) : null}
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-3 pt-5">
        <button
          type="button"
          onClick={handlePrimaryCta}
          className="button-primary"
          disabled={linkingDisabled}
        >
          {primaryButtonLabel}
        </button>

        {step === 3 && user?.plaid?.connections.length ? (
          <button
            type="button"
            onClick={unlinkPlaid}
            className="button-secondary"
            disabled={false}
          >
            Unlink Plaid
          </button>
        ) : undefined}
      </div>
    </GlassCard>
  );
}
