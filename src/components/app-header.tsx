import Link from "next/link";
import { InstallPrompt } from "@/components/install-prompt";
import { Logo } from "@/components/logo";
import { UserMenu } from "@/components/user-menu";

export function AppHeader({ email }: { email?: string }) {
  return (
    <header className="flex items-center justify-between gap-4">
      <Link href="/" className="text-xl" aria-label="RepDay — início">
        <Logo />
      </Link>
      <UserMenu email={email} />
      <InstallPrompt />
    </header>
  );
}
