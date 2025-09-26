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
  const metadata = plaidUser?.metadata ?? null;
  const accounts = metadata?.accounts ?? [];
  const institution = metadata?.institution ?? null;

  const linkTokenPreview = plaidUser?.linkToken
    ? `${plaidUser.linkToken.slice(0, 10)}...${plaidUser.linkToken.slice(-10)}`
    : "—";

  const publicTokenPreview = plaidUser?.publicToken
    ? `${plaidUser.publicToken.slice(0, 10)}...${plaidUser.publicToken.slice(
        -10
      )}`
    : "—";

  return (
    <GlassCard className="flex h-full min-h-[18rem] flex-col gap-4 p-4 text-secondary lg:col-span-2">
      <header>
        <h3 className="text-lg font-semibold text-primary">
          Connection status
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

      <div className="grid gap-2.5 text-sm text-secondary">
        <div className="rounded-2xl border px-3 py-3 surface-panel">
          <p className="text-xs uppercase tracking-widest text-secondary">
            Link token
          </p>
          <div className="group relative inline-block">
            <p className="break-all text-sm font-medium text-primary">
              {linkTokenPreview}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border px-3 py-3 surface-panel">
          <p className="text-xs uppercase tracking-widest text-secondary">
            Public token
          </p>
          <p className="break-all text-sm font-medium text-primary">
            {publicTokenPreview}
          </p>
        </div>

        <div className="rounded-2xl border px-3 py-3 surface-panel">
          <p className="text-xs uppercase tracking-widest text-secondary">
            Institution
          </p>
          {institution ? (
            <p className="text-sm font-medium text-primary">
              {institution.name}
              <span className="ml-2 text-xs text-secondary">
                ({institution.institution_id})
              </span>
            </p>
          ) : (
            <p className="text-sm text-secondary">Not connected</p>
          )}
        </div>
      </div>

      {accounts.length > 0 ? (
        <div className="space-y-2.5">
          <p className="text-xs uppercase tracking-widest text-secondary">
            Accounts
          </p>
          <div className="max-h-56 overflow-y-auto pr-1">
            <ul className="space-y-2 text-sm text-secondary">
              {accounts.map((account) => (
                <li
                  key={account.id}
                  className="rounded-xl border px-3 py-3 surface-panel"
                >
                  <p className="font-medium text-primary">
                    {account.name ?? "Untitled account"}
                    {account.mask ? (
                      <span className="ml-2 text-xs text-secondary">
                        •••• {account.mask}
                      </span>
                    ) : null}
                  </p>
                  <p className="text-xs text-secondary">
                    {account.type ?? "Unknown"}
                    {account.subtype ? ` • ${account.subtype}` : ""}
                  </p>
                  {account.verification_status ? (
                    <p className="text-xs text-secondary">
                      Verification: {account.verification_status}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border px-3 py-3 text-sm text-secondary surface-panel">
          Accounts will appear here after completing Plaid Link.
        </div>
      )}
    </GlassCard>
  );
}
