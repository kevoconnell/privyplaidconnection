import { PLAID_BASE_URLS } from "@/utils/plaid";
import { authenticatePrivyUser } from "@/utils/privy";

import { NextRequest, NextResponse } from "next/server";

import type { LinkTokenCreateRequest, LinkTokenCreateResponse } from "plaid";

function buildLinkTokenRequest(
  base: Partial<LinkTokenCreateRequest> | null
): LinkTokenCreateRequest {
  if (!base) {
    throw new Error("Request body is required");
  }

  const {
    client_name,
    language = "en",
    country_codes = ["US"],
    products = [],
    ...rest
  } = base;

  const clientName = typeof client_name === "string" ? client_name.trim() : "";
  if (!clientName) {
    throw new Error("client_name must be provided in the request body");
  }

  const normalizedCountryCodes = country_codes.map((code) =>
    (code as string).trim()
  );

  return {
    ...(rest as Record<string, unknown>),
    client_name: clientName,
    language,
    country_codes: normalizedCountryCodes,
    products,
  } as LinkTokenCreateRequest;
}

export async function POST(request: NextRequest) {
  //todo: in prod this would be a call to get the config
  const clientId = process.env.PLAID_CLIENT_ID;
  const secret = process.env.PLAID_SECRET;

  const privyUser = await authenticatePrivyUser(request);

  if (!privyUser) {
    return NextResponse.json(
      { error: "Invalid Privy ID token" },
      { status: 401 }
    );
  }

  const requestBody = await request.json();

  try {
    const environment = process.env.PLAID_ENV ?? "sandbox";
    const linkTokenRequest = buildLinkTokenRequest(requestBody);

    const plaidResponse = await fetch(
      `${
        PLAID_BASE_URLS[environment as keyof typeof PLAID_BASE_URLS]
      }/link/token/create`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...linkTokenRequest,
          client_id: clientId,
          secret,
        }),
      }
    );

    if (!plaidResponse.ok) {
      const errorText = await plaidResponse.text().catch(() => "");

      return NextResponse.json(
        {
          error: errorText || "Failed to create Plaid link token",
        },
        { status: plaidResponse.status }
      );
    }

    const data = (await plaidResponse
      .json()
      .catch(() => null)) as LinkTokenCreateResponse | null;

    if (!data?.link_token) {
      return NextResponse.json(
        { error: "Plaid link token missing from response" },
        { status: 502 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const message =
      error instanceof Error
        ? error.message
        : "Unexpected error creating Plaid link token";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
