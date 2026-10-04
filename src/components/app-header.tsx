import Link from "next/link";
import { LogOut, UserRound } from "lucide-react";
import { logout } from "@/app/login/actions";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export function AppHeader({ email }: { email?: string }) {
  return (
    <header className="flex items-center justify-between gap-4">
      <Link href="/" className="text-xl" aria-label="RepDay — início">
        <Logo />
      </Link>
      <div className="flex min-w-0 items-center gap-1 text-sm text-muted-foreground">
        <span className="hidden truncate sm:inline">{email}</span>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/profile">
            <UserRound data-icon="inline-start" />
            Perfil
          </Link>
        </Button>
        <form action={logout}>
          <Button variant="ghost" size="sm">
            <LogOut data-icon="inline-start" />
            Sair
          </Button>
        </form>
      </div>
    </header>
  );
}
