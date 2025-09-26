"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import {
  usePlaidLink,
  type PlaidLinkOnEvent,
  type PlaidLinkOnExit,
  type PlaidLinkOnSuccess,
  type PlaidLinkOptionsWithLinkToken,
} from "react-plaid-link";
import { useAtom, useSetAtom } from "jotai";

import { plaidStatusAtom, plaidUserAtom } from "@/store/plaid";

import type { PlaidLinkUser } from "@/types/plaid";

type LinkPlaidCallbacks = {
  onSuccess?: PlaidLinkOnSuccess;
  onExit?: PlaidLinkOnExit;
  onEvent?: PlaidLinkOnEvent;
};

type UsePrivyWithPlaidReturn = ReturnType<typeof usePrivy> & {
  linkPlaid: (callbacks?: LinkPlaidCallbacks) => Promise<boolean>;
  unlinkPlaid: () => void;
  plaid: PlaidLinkUser | null;
};

const FALLBACK_EXPIRATION_MS = 5 * 60 * 1000;

export function usePrivyWithPlaid(): UsePrivyWithPlaidReturn {
  const privy = usePrivy();
  const [plaidUser, setPlaidUser] = useAtom(plaidUserAtom);
  const setPlaidStatus = useSetAtom(plaidStatusAtom);

  const shouldOpenRef = useRef(false);
  const callbacksRef = useRef<LinkPlaidCallbacks>({});

  const hookConfig = useMemo<PlaidLinkOptionsWithLinkToken>(
    () => ({
      token: plaidUser?.linkToken ?? null,
      onSuccess(publicToken, metadata) {
        setPlaidUser((previous: PlaidLinkUser | null) => ({
          linkToken: previous?.linkToken ?? plaidUser?.linkToken ?? null,
          expiration:
            previous?.expiration ??
            plaidUser?.expiration ??
            new Date(Date.now() + FALLBACK_EXPIRATION_MS).toISOString(),
          publicToken,
          metadata,
        }));

        callbacksRef.current.onSuccess?.(publicToken, metadata);
        shouldOpenRef.current = false;
        setPlaidStatus((previous) => ({
          ...previous,
          linking: false,
          error: null,
        }));
      },
      onExit(error, metadata) {
        callbacksRef.current.onExit?.(error, metadata);
        shouldOpenRef.current = false;
        setPlaidStatus((previous) => ({
          ...previous,
          linking: false,
        }));
      },
      onEvent(eventName, metadata) {
        callbacksRef.current.onEvent?.(eventName, metadata);
      },
    }),
    [plaidUser, setPlaidStatus, setPlaidUser]
  );

  const { open, ready, error, exit } = usePlaidLink(hookConfig);

  useEffect(() => {
    if (!hookConfig.token) {
      return;
    }

    if (!shouldOpenRef.current || !ready) {
      return;
    }

    open();
    shouldOpenRef.current = false;
    setPlaidStatus((previous) => ({
      ...previous,
      linking: true,
    }));
  }, [hookConfig.token, open, ready, setPlaidStatus]);

  useEffect(() => {
    if (!error) {
      setPlaidStatus((previous) => ({ ...previous, error: null }));
      return;
    }

    const normalizedError =
      error instanceof Error
        ? error
        : new Error("Failed to initialize Plaid Link");

    setPlaidStatus((previous) => ({
      ...previous,
      error: normalizedError,
      linking: false,
    }));
    shouldOpenRef.current = false;
  }, [error, setPlaidStatus]);

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
      if (!hookConfig.token) {
        setPlaidStatus((previous) => ({
          ...previous,
          linking: false,
        }));
        return false;
      }

      if (!privy.ready) {
        setPlaidStatus((previous) => ({
          ...previous,
          linking: false,
        }));
        return false;
      }

      if (!privy.authenticated) {
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

  const unlinkPlaid = useCallback(() => {
    callbacksRef.current = {};
    setPlaidUser(null);

    shouldOpenRef.current = false;
    setPlaidStatus((previous) => ({
      ...previous,
      linking: false,
      error: null,
    }));
  }, [setPlaidStatus, setPlaidUser]);

  return {
    ...privy,
    linkPlaid,
    unlinkPlaid,
    plaid: plaidUser,
  };
}
