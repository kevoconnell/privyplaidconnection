import privy from "@/initalizers/privy";
import { NextRequest } from "next/server";

// Verify Privy token
export const authenticatePrivyUser = async (request: NextRequest) => {
  const identityToken = request.headers.get("privy-id-token") ?? "";

  if (!identityToken) {
    return null;
  }

  return await privy.getUser({ idToken: identityToken });
};
