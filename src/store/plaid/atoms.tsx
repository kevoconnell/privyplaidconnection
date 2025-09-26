import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

import type { PlaidLinkUser, PlaidStatus } from "@/types/plaid";

const plaidUserAtom = atomWithStorage<PlaidLinkUser | null>("plaidUser", null);

//note: use this to track loading state and error state in the plaid webview
//in the future this would be in the privy modal directly
const plaidStatusAtom = atom<PlaidStatus>({
  fetchingLinkToken: false,
  linking: false,
  error: null,
});

export { plaidStatusAtom, plaidUserAtom };
