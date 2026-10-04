"use client";

import { useActionState, useState } from "react";
import { CircleAlert, CircleCheck } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/password-input";
import { BodyFields } from "@/components/profile/body-fields";
import { login, signup, type AuthState } from "./actions";

export function LoginForm({ linkError }: { linkError?: boolean }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  // Controlados para não serem apagados quando a action devolve erro.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginState, loginAction, loginPending] = useActionState<AuthState, FormData>(login, undefined);
  const [signupState, signupAction, signupPending] = useActionState<AuthState, FormData>(signup, undefined);

  const isLogin = mode === "login";
  const state = isLogin ? loginState : signupState;
  const pending = isLogin ? loginPending : signupPending;
  const error = state?.error ?? (linkError ? "Não foi possível confirmar o link. Tente novamente." : undefined);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isLogin ? "Entrar" : "Criar conta"}</CardTitle>
        <CardDescription>
          {isLogin
            ? "Use seu e-mail e senha para acessar."
            : "Cadastre-se e já calculamos sua meta diária de água."}
        </CardDescription>
      </CardHeader>

      <form action={isLogin ? loginAction : signupAction}>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Senha</Label>
            <PasswordInput
              id="password"
              name="password"
              autoComplete={isLogin ? "current-password" : "new-password"}
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {!isLogin && <BodyFields />}

          {error && (
            <Alert variant="destructive">
              <CircleAlert />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {state?.message && (
            <Alert>
              <CircleCheck />
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter className="mt-6 flex flex-col gap-2">
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Aguarde..." : isLogin ? "Entrar" : "Criar conta"}
          </Button>
          <Button
            type="button"
            variant="link"
            onClick={() => setMode(isLogin ? "signup" : "login")}
            className="text-muted-foreground"
          >
            {isLogin ? "Não tem conta? Cadastre-se" : "Já tem conta? Entrar"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
