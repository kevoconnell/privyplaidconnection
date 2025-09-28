"use client";

import { useMemo } from "react";
import { useAtomValue } from "jotai";
import { usePrivyWithPlaid } from "@/hooks/usePrivyWithPlaid";
import { plaidStatusAtom } from "@/store/plaid";
import { ConnectionStatusCard } from "@/components/ui/connection-status-card";
import { StepCard } from "@/components/ui/step-card";

import Header from "@/components/ui/header";

export default function PlaidLinkPage() {
  const { authenticated, user } = usePrivyWithPlaid();
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
              <StepCard step={step} />

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
