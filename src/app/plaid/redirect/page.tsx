"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAtomValue } from "jotai";

import { plaidUserAtom } from "@/store/plaid";

export default function PlaidRedirectPage() {
  const router = useRouter();
  const plaidUser = useAtomValue(plaidUserAtom);

  useEffect(() => {
    if (plaidUser?.publicToken) {
      const timeout = setTimeout(() => {
        void router.replace("/");
      }, 100);

      return () => clearTimeout(timeout);
    }

    router.replace("/");
  }, [plaidUser?.publicToken, router]);

  return null;
}
