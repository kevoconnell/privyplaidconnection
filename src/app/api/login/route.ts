import db from "@/initalizers/db";
import { plaidConnections, users } from "@/initalizers/db/drizzle/schema";
import privy from "@/initalizers/privy";
import { UserWithConnections } from "@/types/plaid";
import { sanitizePlaidConnections } from "@/utils/plaid";
import { authenticatePrivyUser } from "@/utils/privy";

import { eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const privyUser = await authenticatePrivyUser(request);

  if (!privyUser) {
    return NextResponse.json(
      { error: "Invalid Privy ID token" },
      { status: 401 }
    );
  }

  try {
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, privyUser.id),
    });

    let userRecord = existingUser;
    const email = privyUser.email?.address ?? null;

    if (!existingUser) {
      const [created] = await db
        .insert(users)
        .values({ id: privyUser.id, email })
        .returning();

      userRecord = created;
    } else if (email && email !== existingUser.email) {
      const [updated] = await db
        .update(users)
        .set({ email, updatedAt: sql`now()` })
        .where(eq(users.id, privyUser.id))
        .returning();

      userRecord = updated ?? existingUser;
    }

    if (!userRecord) {
      throw new Error("Unable to resolve user record");
    }

    const connections = await db.query.plaidConnections.findMany({
      where: eq(plaidConnections.userId, privyUser.id),
    });

    const userWithConnections: UserWithConnections = {
      ...userRecord,
      connections: sanitizePlaidConnections(connections),
    };

    return NextResponse.json({ user: userWithConnections });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create or fetch user";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
