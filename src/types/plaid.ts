import type { PlaidLinkOnSuccessMetadata } from "react-plaid-link";
import type { InferSelectModel } from "drizzle-orm";
import { plaidConnections, users } from "@/initalizers/db/drizzle/schema";
export interface PlaidUserWithConnections
  extends InferSelectModel<typeof users> {
  connections: InferSelectModel<typeof plaidConnections>[];
}

export interface PlaidLinkUser extends PlaidUserWithConnections {
  linkToken: string | null;
  linkTokenExpiration: string | null;
}

export type PlaidStatus = {
  fetchingLinkToken: boolean;
  linking: boolean;
  error: Error | null;
};

export type SanitizedPlaidConnection = Omit<
  typeof plaidConnections.$inferSelect,
  "accessToken"
>;
export type UserWithConnections = typeof users.$inferSelect & {
  connections: SanitizedPlaidConnection[];
};
