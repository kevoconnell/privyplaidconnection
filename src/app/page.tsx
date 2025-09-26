"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAtomValue } from "jotai";

import { FloatingControls } from "@/components/ui/floating-controls";
import { usePrivyWithPlaid } from "@/hooks/usePrivyWithPlaid";
import { plaidStatusAtom, plaidUserAtom } from "@/store/plaid";

const formatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default function PlaidLinkPage() {
  const router = useRouter();

  const { linkPlaid, unlinkPlaid, authenticated, ready, user, login, logout } =
    usePrivyWithPlaid();
  const plaidUser = useAtomValue(plaidUserAtom);
  const plaidStatus = useAtomValue(plaidStatusAtom);
  const metadata = plaidUser?.metadata ?? null;
  const accounts = metadata?.accounts ?? [];
  const institution = metadata?.institution ?? null;

  const step = useMemo(() => {
    if (!authenticated) {
      return 1;
    }

    if (!plaidUser?.publicToken) {
      return 2;
    }

    return 3;
  }, [authenticated, plaidUser?.publicToken]);

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
      <main className="flex min-h-screen flex-col text-foreground">
        <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-3">
            <span className="tag">Plaid + Privy connector</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-secondary">
            {authenticated && user ? (
              <>
                <span className="hidden sm:inline">
                  {user.email?.address ?? user.id}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                  }}
                  className="button-primary"
                >
                  Sign out
                </button>
              </>
            ) : (
              <button type="button" onClick={login} className="button-primary">
                Sign in with Privy
              </button>
            )}
          </div>
        </header>

        <section className="flex-1">
          <div className="mx-auto w-full max-w-6xl px-6 pb-16 pt-10">
            <div className="mb-10 text-left">
              <h1 className="text-4xl font-semibold leading-tight text-primary md:text-5xl">
                Link a bank in seconds using{" "}
                <span className="text-privy">Privy</span> + Plaid
              </h1>
            </div>

            <div
              key={`step-${step}`}
              className="grid gap-8 lg:grid-cols-5 lg:items-stretch"
            >
              <div
                className="flex h-full min-h-112 flex-col rounded-3xl border p-10 text-left text-secondary backdrop-blur-xl lg:col-span-3 lg:h-112"
                style={{
                  backgroundColor: "var(--tag-background)",
                  borderColor: "var(--tag-border)",
                  boxShadow: "var(--shadow-surface)",
                }}
              >
                <div className="flex flex-1 flex-col">
                  <div className="mb-6 flex flex-wrap items-center gap-3">
                    <span className="tag">{stepLabel}</span>
                    <span className="text-sm text-secondary">
                      {stepSubtitle}
                    </span>
                  </div>
                  <h2 className="text-4xl font-semibold leading-snug text-primary md:text-5xl">
                    {headline}
                  </h2>
                  <p className="mt-4 max-w-xl text-base leading-7 text-secondary">
                    {bodyCopy}
                  </p>
                  {supplementalNote && (
                    <p className="mt-3 text-sm text-secondary">
                      {supplementalNote}
                    </p>
                  )}
                </div>

                <div className="mt-auto flex flex-wrap items-center gap-4 pt-10">
                  {step !== 3 && (
                    <button
                      type="button"
                      onClick={handlePrimaryCta}
                      className="button-primary"
                      disabled={linkingDisabled}
                    >
                      {primaryButtonLabel}
                    </button>
                  )}

                  {step === 3 && plaidUser?.publicToken && (
                    <button
                      type="button"
                      onClick={unlinkPlaid}
                      className="button-secondary"
                    >
                      Unlink current Plaid connection
                    </button>
                  )}
                </div>
              </div>

              <aside
                className="flex h-full min-h-112 flex-col gap-6 rounded-3xl border p-8 text-secondary backdrop-blur-xl lg:col-span-2"
                style={{
                  backgroundColor: "var(--tag-background)",
                  borderColor: "var(--tag-border)",
                  boxShadow: "var(--shadow-surface)",
                }}
              >
                <header>
                  <h3 className="text-lg font-semibold text-primary">
                    Connection status
                  </h3>
                  <p className="text-sm text-secondary">
                    Inspect the data captured when Plaid Link completes.
                  </p>
                </header>

                {plaidStatus.error && (
                  <div
                    className="rounded-2xl border bg-red-500/20 px-4 py-3 text-sm text-red-100"
                    style={{ borderColor: "var(--tag-border)" }}
                  >
                    {plaidStatus.error.message}
                  </div>
                )}

                <div className="grid gap-3 text-sm text-secondary">
                  <div
                    className="rounded-2xl border px-4 py-3"
                    style={{
                      backgroundColor: "var(--tag-background)",
                      borderColor: "var(--tag-border)",
                    }}
                  >
                    <p className="text-xs uppercase tracking-widest text-secondary">
                      Link token
                    </p>
                    <div className="group relative inline-block">
                      <p className="break-all text-sm font-medium text-primary">
                        {plaidUser?.linkToken
                          ? plaidUser.linkToken.slice(0, 10) +
                            "..." +
                            plaidUser.linkToken.slice(-10)
                          : "—"}
                      </p>
                    </div>
                  </div>

                  <div
                    className="rounded-2xl border px-4 py-3"
                    style={{
                      backgroundColor: "var(--tag-background)",
                      borderColor: "var(--tag-border)",
                    }}
                  >
                    <p className="text-xs uppercase tracking-widest text-secondary">
                      Public token
                    </p>
                    <p className="break-all text-sm font-medium text-primary">
                      {plaidUser?.publicToken
                        ? plaidUser.publicToken.slice(0, 10) +
                          "..." +
                          plaidUser.publicToken.slice(-10)
                        : "—"}
                    </p>
                  </div>

                  <div
                    className="rounded-2xl border px-4 py-3"
                    style={{
                      backgroundColor: "var(--tag-background)",
                      borderColor: "var(--tag-border)",
                    }}
                  >
                    <p className="text-xs uppercase tracking-widest text-secondary">
                      Institution
                    </p>
                    {institution ? (
                      <p className="text-sm font-medium text-primary">
                        {institution.name}
                        <span className="ml-2 text-xs text-secondary">
                          ({institution.institution_id})
                        </span>
                      </p>
                    ) : (
                      <p className="text-sm text-secondary">Not connected</p>
                    )}
                  </div>
                </div>

                {accounts.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-xs uppercase tracking-widest text-secondary">
                      Accounts
                    </p>
                    <ul className="space-y-2 text-sm text-secondary">
                      {accounts.map((account) => (
                        <li
                          key={account.id}
                          className="rounded-xl border px-4 py-3"
                          style={{
                            backgroundColor: "var(--tag-background)",
                            borderColor: "var(--tag-border)",
                          }}
                        >
                          <p className="font-medium text-primary">
                            {account.name ?? "Untitled account"}
                            {account.mask && (
                              <span className="ml-2 text-xs text-secondary">
                                •••• {account.mask}
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-secondary">
                            {account.type ?? "Unknown"}
                            {account.subtype ? ` • ${account.subtype}` : ""}
                          </p>
                          {account.verification_status && (
                            <p className="text-xs text-secondary">
                              Verification: {account.verification_status}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div
                    className="rounded-2xl border px-4 py-3 text-sm text-secondary"
                    style={{
                      backgroundColor: "var(--tag-background)",
                      borderColor: "var(--tag-border)",
                    }}
                  >
                    Accounts will appear here after completing Plaid Link.
                  </div>
                )}
              </aside>
            </div>
          </div>
        </section>
      </main>
      <FloatingControls />
    </>
  );
}
