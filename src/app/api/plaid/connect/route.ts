import db from "@/initalizers/db";
import {
  plaidConnections,
  transactions,
  users,
} from "@/initalizers/db/drizzle/schema";
import privy from "@/initalizers/privy";
import { UserWithConnections } from "@/types/plaid";
import { PLAID_BASE_URLS, sanitizePlaidConnections } from "@/utils/plaid";
import { authenticatePrivyUser } from "@/utils/privy";

import { eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import type {
  ItemPublicTokenExchangeResponse,
  PlaidError,
  TransactionsGetResponse,
} from "plaid";
import { PlaidInstitution, PlaidLinkOnSuccessMetadata } from "react-plaid-link";

const PLAID_TRANSACTIONS_BATCH_SIZE = 500;
const TRANSACTION_LOOKBACK_MONTHS = 6;

type ConnectRequestBody = {
  publicToken?: string;
  public_token?: string;
  metadata?: PlaidLinkOnSuccessMetadata;
};

function toISODateString(date: Date) {
  return (
    date.toISOString().split("T")[0] ?? new Date().toISOString().split("T")[0]!
  );
}

async function exchangePublicToken(
  publicToken: string
): Promise<ItemPublicTokenExchangeResponse> {
  const clientId = process.env.PLAID_CLIENT_ID;
  const secret = process.env.PLAID_SECRET;
  const baseUrl = PLAID_BASE_URLS.sandbox;

  const response = await fetch(`${baseUrl}/item/public_token/exchange`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      secret,
      public_token: publicToken,
    }),
  });

  if (!response.ok) {
    const errorBody = (await response
      .json()
      .catch(() => null)) as PlaidError | null;

    const message =
      errorBody?.error_message ?? "Failed to exchange public token";
    throw new Error(message);
  }

  const data = (await response.json()) as ItemPublicTokenExchangeResponse;

  if (!data.access_token || !data.item_id) {
    throw new Error("Plaid exchange response is missing required fields");
  }

  return data;
}

async function upsertTransactionsInBackground(
  connectionId: (typeof plaidConnections.$inferSelect)["id"],
  accessToken: string
) {
  try {
    const clientId = process.env.PLAID_CLIENT_ID;
    const secret = process.env.PLAID_SECRET;
    const baseUrl = PLAID_BASE_URLS.sandbox;

    const now = new Date();
    const start = new Date();
    start.setMonth(now.getMonth() - TRANSACTION_LOOKBACK_MONTHS);

    let offset = 0;
    let total = Infinity;

    while (offset < total) {
      const response = await fetch(`${baseUrl}/transactions/get`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          secret,
          access_token: accessToken,
          start_date: toISODateString(start),
          end_date: toISODateString(now),
          options: {
            count: PLAID_TRANSACTIONS_BATCH_SIZE,
            offset,
          },
        }),
      });

      if (!response.ok) {
        const errorBody = (await response
          .json()
          .catch(() => null)) as PlaidError | null;
        const message =
          errorBody?.error_message ??
          `Failed to fetch transactions for connection ${connectionId}`;
        throw new Error(message);
      }

      const data = (await response
        .json()
        .catch(() => null)) as TransactionsGetResponse | null;

      if (!data) {
        break;
      }

      total = data.total_transactions ?? data.transactions.length;
      const accountsById = new Map(
        data.accounts.map((account) => [
          account.account_id,
          account.name ?? account.official_name ?? account.account_id,
        ])
      );

      if (data.transactions.length) {
        const values = data.transactions.map((txn) => {
          return {
            plaidConnectionId: connectionId,
            plaidTransactionId: txn.transaction_id,
            accountId: txn.account_id,
            accountName: accountsById.get(txn.account_id) ?? txn.account_id,
            amount: txn.amount.toString(),
            isoCurrencyCode: txn.iso_currency_code ?? null,
            unofficialCurrencyCode: txn.unofficial_currency_code ?? null,
            date: txn.date,
            authorizedDate: txn.authorized_date ?? null,
            name: txn.name,
            merchantName: txn.merchant_name ?? null,
            pending: Boolean(txn.pending),
            category: txn.personal_finance_category?.primary
              ? [txn.personal_finance_category.primary]
              : null,
            paymentChannel: txn.payment_channel ?? null,
            rawJson: txn,
          };
        });

        await db
          .insert(transactions)
          .values(values)
          .onConflictDoUpdate({
            target: transactions.plaidTransactionId,
            set: {
              accountId: sql`excluded.account_id`,
              accountName: sql`excluded.account_name`,
              amount: sql`excluded.amount`,
              isoCurrencyCode: sql`excluded.iso_currency_code`,
              unofficialCurrencyCode: sql`excluded.unofficial_currency_code`,
              date: sql`excluded.date`,
              authorizedDate: sql`excluded.authorized_date`,
              name: sql`excluded.name`,
              merchantName: sql`excluded.merchant_name`,
              pending: sql`excluded.pending`,
              category: sql`excluded.category`,
              paymentChannel: sql`excluded.payment_channel`,
              rawJson: sql`excluded.raw_json`,
              updatedAt: sql`now()`,
            },
          });
      }

      if (!data.transactions.length) {
        break;
      }

      offset += data.transactions.length;
    }
  } catch (error) {
    console.error("Failed to sync Plaid transactions", {
      connectionId,
      error,
    });
  }
}

function extractInstitutionDetails(
  institution: PlaidInstitution | null | undefined
) {
  if (!institution) {
    return { institutionId: null, institutionName: null };
  }

  return {
    institutionId: institution.institution_id ?? null,
    institutionName: institution.name ?? null,
  };
}

export async function POST(request: NextRequest) {
  const privyUser = await authenticatePrivyUser(request);

  if (!privyUser) {
    return NextResponse.json(
      { error: "Invalid Privy ID token" },
      { status: 401 }
    );
  }

  const body = (await request
    .json()
    .catch(() => null)) as ConnectRequestBody | null;

  if (!body || (!body.publicToken && !body.public_token)) {
    return NextResponse.json(
      { error: "publicToken is required" },
      { status: 400 }
    );
  }

  const userRecord = await db.query.users.findFirst({
    where: eq(users.id, privyUser.id),
  });

  let exchangeResponse: ItemPublicTokenExchangeResponse;
  try {
    exchangeResponse = await exchangePublicToken(
      body.publicToken ?? body.public_token ?? ""
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to exchange public token";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const institution = extractInstitutionDetails(body.metadata?.institution);

  if (!userRecord) {
    throw new Error("Failed to resolve user after upsert");
  }
  try {
    const result = await db.transaction(async (tx) => {
      const [connection] = await tx
        .insert(plaidConnections)
        .values({
          userId: privyUser.id,
          plaidItemId: exchangeResponse.item_id,
          accessToken: exchangeResponse.access_token,
          institutionId: institution.institutionId,
          institutionName: institution.institutionName,
        })
        .onConflictDoUpdate({
          target: plaidConnections.plaidItemId,
          set: {
            accessToken: sql`excluded.access_token`,
            institutionId: sql`excluded.institution_id`,
            institutionName: sql`excluded.institution_name`,
            updatedAt: sql`now()`,
          },
        })
        .returning();

      const connections = await tx.query.plaidConnections.findMany({
        where: eq(plaidConnections.userId, privyUser.id),
      });

      return {
        user: userRecord,
        connection,
        connections,
      };
    });

    const userWithConnections: UserWithConnections = {
      ...result.user,
      connections: sanitizePlaidConnections(result.connections),
    };

    void upsertTransactionsInBackground(
      result.connection.id,
      result.connection.accessToken
    );

    return NextResponse.json({ user: userWithConnections });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to store Plaid connection";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
