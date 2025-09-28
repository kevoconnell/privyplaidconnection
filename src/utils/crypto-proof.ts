import {
  keccak256,
  recoverTypedDataAddress,
  getAddress,
  isAddressEqual,
} from "viem";

const domain = {
  name: "PlaidAttestation",
  version: "1",
} as const;

const types = {
  Attestation: [
    { name: "schema", type: "string" },
    { name: "aud", type: "string" },
    { name: "nonce", type: "bytes32" },
    { name: "issuedAt", type: "uint64" },
    { name: "expiresAt", type: "uint64" },
    { name: "plaidRoot", type: "bytes32" },
    { name: "valueCents", type: "uint256" },
    { name: "predicate", type: "string" },
  ],
} as const;

export interface CryptoProof {
  commitment: string;
  signature: string;
  publicKey: string;
  range: [number, number];
  value: number;
  message: string;
  walletAddress?: string;

  attestation?: AttestationMessage;
  nonce?: string;
}

export interface AttestationMessage {
  schema: string;
  aud: string;
  nonce: `0x${string}`;
  issuedAt: bigint | string; // Can be BigInt or string for serialization
  expiresAt: bigint | string; // Can be BigInt or string for serialization
  plaidRoot: `0x${string}`;
  valueCents: bigint | string; // Can be BigInt or string for serialization
  predicate: string;
}

export interface ProofMessage {
  message: string;
  commitment: string;
  range: [number, number];
  value: number;
}

export interface ProofVerification {
  isValid: boolean;
  publicKey: string;
  range: [number, number];
  signatureValid: boolean;
}

//note: a better use of this would be ZK, but this is simple enough version for now - this is just a hash of txns (without name)
export function generatePlaidRoot(
  transactions: any[],
  category: string
): `0x${string}` {
  const categoryTransactions = transactions
    .filter((tx) => tx.category && tx.category.includes(category))
    .map((tx) => ({
      id: tx.id,
      amount: Math.round(tx.amount * 100),
      category: tx.category,
      date: tx.date,
    }));

  categoryTransactions.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const dataString = JSON.stringify({
    category,
    transactions: categoryTransactions,
    timestamp: Math.floor(Date.now() / (1000 * 60 * 10)),
  });

  const hash = keccak256(new TextEncoder().encode(dataString));
  return hash as `0x${string}`;
}

export async function signAttestation(
  transactions: any[],
  category: string,
  threshold: number
): Promise<AttestationMessage> {
  const plaidRoot = generatePlaidRoot(transactions, category);

  const totalSpending = transactions
    .filter((tx) => tx.category && tx.category.includes(category))
    .reduce((sum, tx) => sum + Math.round(tx.amount * 100), 0);

  const valueCents = BigInt(totalSpending);
  const message: AttestationMessage = {
    schema: "plaid.sum.v1",
    aud: "privy-plaid-demo",
    nonce: ("0x" +
      crypto
        .getRandomValues(new Uint8Array(32))
        .reduce(
          (s, b) => s + b.toString(16).padStart(2, "0"),
          ""
        )) as `0x${string}`,
    issuedAt: BigInt(Math.floor(Date.now() / 1000)),
    expiresAt: BigInt(Math.floor(Date.now() / 1000) + 60 * 60 * 24), // 1 day
    plaidRoot,
    valueCents,
    predicate: `sum(${category}) >= ${threshold}`,
  };

  const serializableMessage = {
    ...message,
    issuedAt: message.issuedAt.toString(),
    expiresAt: message.expiresAt.toString(),
    valueCents: message.valueCents.toString(),
  };

  return serializableMessage as AttestationMessage;
}

export function verifyPlaidRoot(
  plaidRoot: `0x${string}`,
  transactions: any[],
  category: string
): boolean {
  const expectedRoot = generatePlaidRoot(transactions, category);

  return plaidRoot === expectedRoot;
}

export async function verifyAttestation(params: {
  address: `0x${string}`;
  signature: `0x${string}`;
  message: AttestationMessage;
  transactions?: any[];
  category?: string;
}): Promise<{ ok: boolean; reason?: string }> {
  try {
    const messageForVerification = {
      ...params.message,
      issuedAt: BigInt(params.message.issuedAt.toString()),
      expiresAt: BigInt(params.message.expiresAt.toString()),
      valueCents: BigInt(params.message.valueCents.toString()),
    };

    const recovered = await recoverTypedDataAddress({
      domain,
      types,
      primaryType: "Attestation",
      message: messageForVerification,
      signature: params.signature,
    });

    if (!isAddressEqual(getAddress(recovered), getAddress(params.address))) {
      return { ok: false, reason: "bad signature" };
    }

    const now = BigInt(Math.floor(Date.now() / 1000));
    if (BigInt(params.message.expiresAt.toString()) < now) {
      return { ok: false, reason: "expired" };
    }

    if (params.transactions && params.category) {
      const plaidRootValid = verifyPlaidRoot(
        params.message.plaidRoot,
        params.transactions,
        params.category
      );

      if (!plaidRootValid) {
        return { ok: false, reason: "invalid plaid root" };
      }
    }

    return { ok: true };
  } catch (_error) {
    console.error("Failed to verify attestation:", _error);

    return { ok: false, reason: "verification failed" + _error };
  }
}
