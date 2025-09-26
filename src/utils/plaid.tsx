import { CountryCode, LinkTokenCreateRequest, Products } from "plaid";

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
];
