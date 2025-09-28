import { useRouter } from "next/navigation";
import { SignInButton } from "../sign-in-button";

const Header = () => {
  const router = useRouter();
  return (
    <header className="mx-auto flex w-full max-w-4xl md:max-w-full items-center justify-between space-x-3  py-4 sm:px-4 sm:py-5 md:py-6">
      <div className="flex items-center gap-2">
        <button
          onClick={() => router.push("/")}
          className="tag text-xs md:text-sm hover:text-primary"
        >
          Plaid + Privy connector
        </button>
      </div>
      <SignInButton />
    </header>
  );
};

export default Header;
