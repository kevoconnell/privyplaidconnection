"use client";

import { useEffect, useMemo, useRef } from "react";
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

  const [plaidUser, setPlaidUser] = useAtom(plaidUserAtom);
  const setPlaidStatus = useSetAtom(plaidStatusAtom);
  const { identityToken } = useIdentityToken();
  const linkTokenRequested = useRef(false);

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

  const fetchLinkToken = async (request: LinkTokenCreateRequest) => {
    console.log(
      "fetchLinkToken",
      ready,
      authenticated,
      identityToken,
      hasValidLinkToken
    );
    console.log("Early return conditions:", {
      notReady: !ready,
      notAuthenticated: !authenticated,
      noIdentityToken: !identityToken,
      hasValidToken: hasValidLinkToken,
      plaidUser: plaidUser,
    });
    if (!ready || !authenticated || !identityToken || hasValidLinkToken) {
      console.log("Early return triggered - no network call will be made");
      linkTokenRequested.current = false;
      setPlaidStatus((previous) => ({
        ...previous,
        fetchingLinkToken: false,
      }));
      return;
    }

    setPlaidStatus((previous) => ({
      ...previous,
      fetchingLinkToken: true,
    }));

    console.log("Making network call to /api/plaid/link-token");
    const response = await fetch("/api/plaid/link-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "privy-id-token": identityToken ?? "",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
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
      setPlaidStatus((previous) => ({
        ...previous,
        fetchingLinkToken: false,
      }));
      throw new Error(data?.error || "Plaid link token missing from response");
    }

    setPlaidUser((previous) => {
      if (!previous) return null;
      return {
        ...previous,
        linkToken: data.link_token,
        linkTokenExpiration: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      };
    });

    setPlaidStatus((previous) => ({
      ...previous,
      fetchingLinkToken: false,
    }));
  };

  useEffect(() => {
    if (linkTokenRequested.current) {
      return;
    }

    linkTokenRequested.current = true;

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

    fetchLinkToken(request);
  }, [authenticated, hasValidLinkToken, ready, identityToken, countryCodes, language, user?.id, fetchLinkToken]);

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
