import { CountryCode, LinkTokenCreateRequest, Products } from "plaid";
import type { plaidConnections } from "@/initalizers/db/drizzle/schema";
import { SanitizedPlaidConnection } from "@/types/plaid";

export const PLAID_BASE_URLS = {
  sandbox: "https://sandbox.plaid.com",
  development: "https://development.plaid.com",
  production: "https://production.plaid.com",
} as const;

export const DEFAULT_LANGUAGE: LinkTokenCreateRequest["language"] = "en";
export const DEFAULT_COUNTRY_CODES: LinkTokenCreateRequest["country_codes"] = [
  CountryCode.Us,
];

export const DEFAULT_PRODUCTS: LinkTokenCreateRequest["products"] = [
  Products.Auth,
  Products.Transactions,
];

export function sanitizePlaidConnection(
  connection: typeof plaidConnections.$inferSelect
): SanitizedPlaidConnection {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { accessToken, ...rest } = connection;
  return rest;
}

export function sanitizePlaidConnections(
  connections: (typeof plaidConnections.$inferSelect)[]
): SanitizedPlaidConnection[] {
  return connections.map(sanitizePlaidConnection);
}
