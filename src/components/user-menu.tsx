"use client";

import Link from "next/link";
import { useTransition } from "react";
import { ChevronDown, LogOut, UserRound } from "lucide-react";
import { logout } from "@/app/login/actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** Avatar com a inicial do e-mail; abre o menu com quem está logado, Perfil e Sair. */
export function UserMenu({ email }: { email?: string }) {
  const [pending, startTransition] = useTransition();
  const initial = email?.trim().charAt(0).toUpperCase() || "?";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex min-w-0 items-center gap-2 rounded-full p-0.5 text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring sm:rounded-lg sm:py-1 sm:pr-2 sm:pl-1"
        aria-label={`Conta: ${email ?? "usuário"}`}
      >
        <Avatar>
          <AvatarFallback className="bg-sky-500 font-medium text-white">{initial}</AvatarFallback>
        </Avatar>
        <span className="hidden max-w-48 truncate sm:inline">{email}</span>
        <ChevronDown className="hidden size-4 shrink-0 sm:block" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="text-xs font-normal text-muted-foreground">Conectado como</span>
          <span className="truncate font-medium text-foreground">{email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <UserRound />
            Perfil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          disabled={pending}
          // Mantém o menu aberto até o logout redirecionar.
          onSelect={(e) => {
            e.preventDefault();
            startTransition(() => logout());
          }}
        >
          <LogOut />
          {pending ? "Saindo..." : "Sair"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
