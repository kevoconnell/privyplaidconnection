"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useIdentityToken, usePrivy, User } from "@privy-io/react-auth";
import {
  PlaidLinkOnSuccessMetadata,
  usePlaidLink,
  type PlaidLinkOnEvent,
  type PlaidLinkOnExit,
  type PlaidLinkOnSuccess,
} from "react-plaid-link";
import { useAtom, useSetAtom } from "jotai";

import { plaidStatusAtom, plaidUserAtom } from "@/store/plaid";

import type { PlaidLinkUser } from "@/types/plaid";

type LinkPlaidCallbacks = {
  onSuccess?: PlaidLinkOnSuccess;
  onExit?: PlaidLinkOnExit;
  onEvent?: PlaidLinkOnEvent;
};

type UsePrivyWithPlaidReturn = Omit<ReturnType<typeof usePrivy>, "user"> & {
  linkPlaid: (callbacks?: LinkPlaidCallbacks) => Promise<boolean>;
  unlinkPlaid: () => void;
  user: (User & { plaid: PlaidLinkUser | null }) | null;
};

export function usePrivyWithPlaid(): UsePrivyWithPlaidReturn {
  const privy = usePrivy();
  const { identityToken } = useIdentityToken();
  const [plaidUser, setPlaidUser] = useAtom(plaidUserAtom);
  const setPlaidStatus = useSetAtom(plaidStatusAtom);

  const shouldOpenRef = useRef(false);
  const callbacksRef = useRef<LinkPlaidCallbacks>({});

  const hookConfig = useMemo(
    () => ({
      token: plaidUser?.linkToken ?? null,
      async onSuccess(
        publicToken: string,
        metadata: PlaidLinkOnSuccessMetadata
      ) {
        callbacksRef.current.onSuccess?.(publicToken, metadata);
        shouldOpenRef.current = false;
        const connectionResponse = await fetch("/api/plaid/connect", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "privy-id-token": identityToken ?? "",
          },
          body: JSON.stringify({ publicToken, metadata }),
        });

        if (!connectionResponse.ok) {
          throw new Error("Failed to connect Plaid");
        }
        const connectionData = await connectionResponse.json();
        setPlaidUser((previous) => ({
          ...previous,
          ...connectionData.user,
          connections: connectionData.user.connections,
        }));
        setPlaidStatus((previous) => ({
          ...previous,
          linking: false,
          error: null,
        }));
      },
      //todo: fix any
      onExit(_error: any, metadata: any) {
        callbacksRef.current.onExit?.(_error, metadata);
        shouldOpenRef.current = false;
        setPlaidStatus((previous) => ({
          ...previous,
          linking: false,
        }));
      },
      //todo: fix any
      onEvent(eventName: any, metadata: any) {
        callbacksRef.current.onEvent?.(eventName, metadata);
      },
    }),
    [plaidUser?.linkToken, setPlaidStatus, setPlaidUser, identityToken]
  );

  const { open, ready, exit } = usePlaidLink(hookConfig);

  //call login when there is a user and authenticated
  useEffect(() => {
    const fetchUserData = async () => {
      if (privy.user && privy.authenticated) {
        const loginResponse = await fetch("/api/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "privy-id-token": identityToken ?? "",
          },
        });

        if (!loginResponse.ok) {
          throw new Error("Failed to login");
        }
        const loginData = await loginResponse.json();

        setPlaidUser((previous) => ({
          ...previous,
          ...loginData.user,
          connections: loginData.user.connections,
        }));
      }
    };

    fetchUserData();
  }, [privy.user, privy.authenticated, setPlaidUser, identityToken]);

  useEffect(() => {
    return () => {
      exit?.();
      shouldOpenRef.current = false;
      setPlaidStatus((previous) => ({
        ...previous,
        linking: false,
      }));
    };
  }, [exit, setPlaidStatus]);

  const linkPlaid = useCallback(
    async (callbacks?: LinkPlaidCallbacks) => {
      if (!privy.ready || !privy.authenticated || !hookConfig.token) {
        setPlaidStatus((previous) => ({
          ...previous,
          linking: false,
        }));
        return false;
      }

      callbacksRef.current = callbacks ?? {};

      shouldOpenRef.current = true;
      setPlaidStatus((previous) => ({
        ...previous,
        linking: true,
        error: null,
      }));

      if (ready) {
        shouldOpenRef.current = false;
        open();
        return true;
      }

      return false;
    },
    [
      hookConfig.token,
      open,
      privy.authenticated,
      privy.ready,
      ready,
      setPlaidStatus,
    ]
  );

  const unlinkPlaid = useCallback(async () => {
    if (!privy.authenticated || !privy.user) {
      return;
    }

    callbacksRef.current = {};

    const removeResponse = await fetch("/api/plaid/remove", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "privy-id-token": identityToken ?? "",
      },
    });
    if (!removeResponse.ok) {
      throw new Error("Failed to remove Plaid");
    }

    const removeData = await removeResponse.json();
    setPlaidUser((previous) => ({
      ...previous,
      ...removeData.user,
      connections: removeData.user.connections,
    }));
    shouldOpenRef.current = false;
    setPlaidStatus((previous) => ({
      ...previous,
      linking: false,
      error: null,
    }));
  }, [setPlaidStatus, setPlaidUser, privy, identityToken]);

  const privyUserWithPlaid = useMemo(() => {
    if (!privy.user) {
      return null;
    }

    return {
      ...privy.user,
      plaid: plaidUser,
    };
  }, [privy.user, plaidUser]);

  return {
    ...privy,
    user: privyUserWithPlaid,
    linkPlaid,
    unlinkPlaid,
  };
}
