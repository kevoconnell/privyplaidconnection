import type { PlaidLinkUser, PlaidStatus } from "@/types/plaid";

import { GlassCard } from "./glass-card";

interface ConnectionStatusCardProps {
  plaidStatus: PlaidStatus;
  plaidUser: PlaidLinkUser | null;
}

export function ConnectionStatusCard({
  plaidStatus,
  plaidUser,
}: ConnectionStatusCardProps) {
  const connections = plaidUser?.connections ?? [];
  const hasConnections = connections.length > 0;

  const linkTokenPreview = plaidUser?.linkToken
    ? `${plaidUser.linkToken.slice(0, 10)}...${plaidUser.linkToken.slice(-10)}`
    : "—";

  const linkTokenExpiration = plaidUser?.linkTokenExpiration
    ? new Date(plaidUser.linkTokenExpiration).toLocaleString()
    : "—";

  return (
    <GlassCard className="flex h-full   flex-col gap-4 p-4 text-secondary lg:col-span-2">
      <header>
        <h3 className="text-lg font-semibold text-primary">
          Plaid Connection status
        </h3>
        <p className="text-sm text-secondary">
          Inspect the data captured when Plaid Link completes.
        </p>
      </header>

      {plaidStatus.error ? (
        <div className="rounded-2xl border bg-red-500/20 px-4 py-3 text-sm text-red-100 border-tag">
          {plaidStatus.error.message}
        </div>
      ) : null}

      <div className="space-y-2.5">
        <div className="">
          <ul className="space-y-2 text-sm text-secondary">
            <li className="rounded-xl border px-3 py-3 surface-panel overflow-hidden">
              <p className="text-xs uppercase tracking-widest text-secondary">
                Link token
              </p>
              <p className="break-all text-sm font-medium text-primary">
                {linkTokenPreview}
              </p>
            </li>

            <li className="rounded-xl border px-3 py-3 surface-panel overflow-hidden">
              <p className="text-xs uppercase tracking-widest text-secondary">
                Link Token Expiration
              </p>
              <p className="text-sm font-medium text-primary">
                {linkTokenExpiration}
              </p>
            </li>

            <li className="rounded-xl border px-3 py-3 surface-panel overflow-hidden">
              <p className="text-xs uppercase tracking-widest text-secondary">
                User ID
              </p>
              <p className="text-sm font-medium text-primary">
                {plaidUser?.id.slice(0, 8)}...{plaidUser?.id.slice(-8)}
              </p>
            </li>

            <li className="rounded-xl border px-3 py-3 surface-panel overflow-hidden">
              <p className="text-xs uppercase tracking-widest text-secondary">
                Email
              </p>
              <p className="text-sm font-medium text-primary">
                {plaidUser?.email ?? "—"}
              </p>
            </li>
          </ul>
        </div>
      </div>

      {hasConnections ? (
        <div className="space-y-2.5">
          <p className="text-xs uppercase tracking-widest text-secondary">
            Plaid Connections
          </p>
          <div className="max-h-56 overflow-y-auto pr-1">
            <ul className="space-y-2 text-sm text-secondary">
              {connections.map((connection) => (
                <li
                  key={connection.id}
                  className="rounded-xl border px-3 py-3 surface-panel"
                >
                  <p className="font-medium text-primary">
                    {connection.institutionName ?? "Unknown Institution"}
                    <span className="ml-2 text-xs text-secondary">
                      ({connection.institutionId})
                    </span>
                  </p>
                  <p className="text-xs text-secondary">
                    Item ID: {connection.plaidItemId?.slice(0, 8)}...
                  </p>
                  <p className="text-xs text-secondary">
                    Created:{" "}
                    {new Date(connection.createdAt).toLocaleDateString()}
                  </p>
                  {connection.updatedAt !== connection.createdAt && (
                    <p className="text-xs text-secondary">
                      Updated:{" "}
                      {new Date(connection.updatedAt).toLocaleDateString()}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border px-3 py-3 text-sm text-secondary surface-panel">
          No Plaid connections found. Complete Plaid Link to connect your
          accounts.
        </div>
      )}
    </GlassCard>
  );
}
