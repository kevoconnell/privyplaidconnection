import db from "@/initalizers/db";
import {
  plaidConnections,
  transactions,
  users,
} from "@/initalizers/db/drizzle/schema";

import { PLAID_BASE_URLS } from "@/utils/plaid";
import { type UserWithConnections } from "@/types/plaid";

import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { authenticatePrivyUser } from "@/utils/privy";

async function removePlaidItem(accessToken: string) {
  const clientId = process.env.PLAID_CLIENT_ID;
  const secret = process.env.PLAID_SECRET;
  const environment = (process.env.PLAID_ENV ??
    "sandbox") as keyof typeof PLAID_BASE_URLS;
  const baseUrl = PLAID_BASE_URLS[environment];

  if (!clientId || !secret) {
    throw new Error("PLAID_CLIENT_ID and PLAID_SECRET must be configured");
  }

  if (!baseUrl) {
    throw new Error(`Unsupported PLAID_ENV provided: ${environment}`);
  }

  const response = await fetch(`${baseUrl}/item/remove`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      secret: secret,
      access_token: accessToken,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.error_message ||
        `Plaid item removal failed: ${response.statusText}`
    );
  }

  return response.json();
}

export async function DELETE(request: NextRequest) {
  const privyUser = await authenticatePrivyUser(request);

  if (!privyUser) {
    return NextResponse.json(
      { error: "Invalid Privy ID token" },
      { status: 401 }
    );
  }

  // Return user with empty connections if no connections exist
  const userRecord = await db.query.users.findFirst({
    where: eq(users.id, privyUser.id),
  });

  if (!userRecord) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  try {
    // Get all connections for the user
    const connections = await db.query.plaidConnections.findMany({
      where: eq(plaidConnections.userId, privyUser.id),
    });

    if (connections.length === 0) {
      if (!userRecord) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const userWithConnections: UserWithConnections = {
        ...userRecord,
        connections: [],
      };

      return NextResponse.json({ user: userWithConnections });
    }

    // Remove each connection from Plaid and database
    const removalPromises = connections.map(async (connection) => {
      try {
        await removePlaidItem(connection.accessToken);

        //note: this could also be a soft delete depending on preference
        const deletedConnection = await db
          .delete(plaidConnections)
          .where(eq(plaidConnections.id, connection.id))
          .returning();

        //delete ttransactions associated with the connection
        const deletedTransactions = await db
          .delete(transactions)
          .where(eq(transactions.plaidConnectionId, connection.id))
          .returning();

        if (deletedConnection && deletedTransactions) {
          return {
            success: true,
            connectionId: connection.id,
            error: null,
          };
        }
        return {
          success: false,
          connectionId: connection.id,
          error: "Connection not found",
        };
      } catch (error) {
        console.error(`Failed to remove connection ${connection.id}:`, error);
        return {
          success: false,
          connectionId: connection.id,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    });

    const results = await Promise.all(removalPromises);

    // Check if any removals failed
    const failures = results.filter((result) => !result.success);
    if (failures.length > 0) {
      console.error("Some connections failed to remove:", failures);
      //todo: do something with failure
    }

    const user: UserWithConnections = {
      ...userRecord,
      connections: [],
    };

    return NextResponse.json({
      user,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to remove Plaid connections";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
