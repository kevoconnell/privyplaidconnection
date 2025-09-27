"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePrivyWithPlaid } from "@/hooks/usePrivyWithPlaid";

export default function PlaidRedirectPage() {
  const router = useRouter();
  const { user } = usePrivyWithPlaid();

  useEffect(() => {
    if (user?.plaid?.connections) {
      const timeout = setTimeout(() => {
        void router.replace("/");
      }, 100);

      return () => clearTimeout(timeout);
    }

    router.replace("/");
  }, [user?.plaid?.connections, router]);

  return null;
}
