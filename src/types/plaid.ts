import type { PlaidLinkOnSuccessMetadata } from "react-plaid-link";

export interface PlaidLinkUser {
  linkToken: string | null;
  expiration: string | null;
  publicToken?: string | null;
  metadata?: PlaidLinkOnSuccessMetadata | null;
}

export type PlaidStatus = {
  fetchingLinkToken: boolean;
  linking: boolean;
  error: Error | null;
};
