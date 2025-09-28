"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  PrivyProvider,
  useIdentityToken,
  usePrivy,
} from "@privy-io/react-auth";
import {
  Provider as JotaiProvider,
  createStore,
  useAtom,
  useSetAtom,
} from "jotai";
import {
  type LinkTokenCreateRequest,
  type LinkTokenCreateResponse,
} from "plaid";
import { plaidStatusAtom, plaidUserAtom } from "@/store/plaid";
import {
  DEFAULT_COUNTRY_CODES,
  DEFAULT_LANGUAGE,
  DEFAULT_PRODUCTS,
} from "@/utils/plaid";

import { useResolvedTheme } from "@/hooks/useResolvedTheme";
const jotaiStore = createStore();

interface PlaidLinkProviderProps {
  children: React.ReactNode;
  language?: LinkTokenCreateRequest["language"];
  countryCodes?: LinkTokenCreateRequest["country_codes"];
}

function PlaidLinkProvider({
  children,
  language = DEFAULT_LANGUAGE,
  countryCodes = DEFAULT_COUNTRY_CODES,
}: PlaidLinkProviderProps) {
  const { ready, authenticated, user } = usePrivy();
  const [isFetchingLinkToken, setIsFetchingLinkToken] = useState(false);
  const [plaidUser, setPlaidUser] = useAtom(plaidUserAtom);
  const setPlaidStatus = useSetAtom(plaidStatusAtom);
  const { identityToken } = useIdentityToken();

  const hasValidLinkToken = useMemo(() => {
    if (!plaidUser?.linkToken || !plaidUser.linkTokenExpiration) {
      return false;
    }

    const expiresAt = Date.parse(plaidUser.linkTokenExpiration);
    return !Number.isNaN(expiresAt) && expiresAt > Date.now();
  }, [plaidUser]);

  useEffect(() => {
    if (!authenticated && ready) {
      setPlaidUser(null);
      setPlaidStatus((previous) => ({
        ...previous,
        linking: false,
        error: null,
      }));
    }
  }, [authenticated, ready, setPlaidStatus, setPlaidUser]);

  const fetchLinkToken = useCallback(
    async (request: LinkTokenCreateRequest) => {
      //if
      if (
        !ready ||
        !authenticated ||
        isFetchingLinkToken ||
        !identityToken ||
        hasValidLinkToken ||
        (plaidUser?.connections?.length ?? 0) > 0
      ) {
        setPlaidStatus((previous) => ({
          ...previous,
          fetchingLinkToken: false,
        }));
        return;
      }

      setIsFetchingLinkToken(true);
      setPlaidStatus((previous) => ({
        ...previous,
        fetchingLinkToken: true,
      }));

      const response = await fetch("/api/plaid/link-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "privy-id-token": identityToken ?? "",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        setIsFetchingLinkToken(false);
        setPlaidStatus((previous) => ({
          ...previous,
          fetchingLinkToken: false,
        }));
        const message = await response.text().catch(() => "");
        throw new Error(message || "Unable to create Plaid link token");
      }

      const data = (await response.json().catch(() => null)) as
        | (LinkTokenCreateResponse & { error?: string })
        | null;

      if (!data?.link_token) {
        setIsFetchingLinkToken(false);
        setPlaidStatus((previous) => ({
          ...previous,
          fetchingLinkToken: false,
        }));
        throw new Error(
          data?.error || "Plaid link token missing from response"
        );
      }

      setPlaidUser((previous) => {
        if (!previous) return null;
        return {
          ...previous,
          linkToken: data.link_token,
          linkTokenExpiration: new Date(
            Date.now() + 5 * 60 * 1000
          ).toISOString(),
        };
      });

      setIsFetchingLinkToken(false);
      setPlaidStatus((previous) => ({
        ...previous,
        fetchingLinkToken: false,
      }));
    },
    [
      authenticated,
      hasValidLinkToken,
      identityToken,
      isFetchingLinkToken,
      ready,
      setPlaidStatus,
      setPlaidUser,
    ]
  );

  useEffect(() => {
    if (!authenticated) {
      return;
    }

    if (hasValidLinkToken) {
      return;
    }

    const request: LinkTokenCreateRequest = {
      //todo: this should be configurable via dashboard, also have prefilling existing user data
      client_name: "Privy Plaid Link",
      language,
      country_codes: countryCodes,
      user: {
        client_user_id: user?.id ?? "anonymous",
      },
      //todo: in the future this should be configurable via dashboard
      products: DEFAULT_PRODUCTS,
    };

    void fetchLinkToken(request);
  }, [
    authenticated,
    countryCodes,
    fetchLinkToken,
    hasValidLinkToken,
    language,
    user?.id,
  ]);

  return <>{children}</>;
}

interface ProvidersProps {
  children: React.ReactNode;
  plaidLanguage?: LinkTokenCreateRequest["language"];
  plaidCountryCodes?: LinkTokenCreateRequest["country_codes"];
}

function PrivyPlaidProviderWithTheme({
  children,
  plaidLanguage,
  plaidCountryCodes,
}: ProvidersProps) {
  const resolvedTheme = useResolvedTheme();

  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      clientId={process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID!}
      config={{
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
          solana: {
            createOnLogin: "users-without-wallets",
          },
        },
        appearance: {
          accentColor: "#5b50ff",
          walletChainType: "ethereum-and-solana",
          theme: resolvedTheme,
        },
      }}
    >
      <PlaidLinkProvider
        language={plaidLanguage}
        countryCodes={plaidCountryCodes}
      >
        {children}
      </PlaidLinkProvider>
    </PrivyProvider>
  );
}

//wrapping jotai provider so we can access theme
export default function Providers(props: ProvidersProps) {
  return (
    <JotaiProvider store={jotaiStore}>
      <PrivyPlaidProviderWithTheme {...props} />
    </JotaiProvider>
  );
}
