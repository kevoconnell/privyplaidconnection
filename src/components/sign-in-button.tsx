import { usePrivyWithPlaid } from "@/hooks/usePrivyWithPlaid";

import type { HTMLAttributes } from "react";

type SignInButtonProps = HTMLAttributes<HTMLDivElement>;

export function SignInButton({ className = "", ...props }: SignInButtonProps) {
  const { authenticated, user, login, logout } = usePrivyWithPlaid();
  return (
    <div
      className={`flex items-center gap-2 text-xs md:text-sm text-secondary ${className}`.trim()}
      {...props}
    >
      {authenticated && user ? (
        <>
          <span className="hidden sm:inline">
            {user.email?.address ?? user.id}
          </span>
          <button
            type="button"
            onClick={() => {
              logout();
            }}
            className="button-primary"
          >
            Sign out
          </button>
        </>
      ) : (
        <button type="button" onClick={login} className="button-primary">
          Sign in with Privy
        </button>
      )}
    </div>
  );
}
