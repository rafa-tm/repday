"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { saveProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import { parseBodyForm } from "@/lib/water";

export type AuthState = { error?: string; message?: string } | undefined;

function readCredentials(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Preencha e-mail e senha." } as const;
  if (password.length < 6) return { error: "A senha precisa ter pelo menos 6 caracteres." } as const;
  return { email, password } as const;
}

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const creds = readCredentials(formData);
  if ("error" in creds) return { error: creds.error };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(creds);
  if (error) {
    return {
      error:
        error.code === "email_not_confirmed"
          ? "Confirme seu e-mail antes de entrar."
          : "E-mail ou senha inválidos.",
    };
  }

  redirect("/");
}

export async function signup(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const creds = readCredentials(formData);
  if ("error" in creds) return { error: creds.error };
  const body = parseBodyForm(formData);
  if (!body.success) return { error: body.error.issues[0].message };

  const origin = (await headers()).get("origin");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    ...creds,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });
  if (error) {
    return { error: error.code === "user_already_exists" ? "Este e-mail já está cadastrado." : error.message };
  }

  // Com confirmação de e-mail, um e-mail já cadastrado volta como usuário "falso" sem identidades.
  if (data.user?.identities?.length) await saveProfile(data.user.id, body.data);

  // Sem confirmação de e-mail habilitada, o Supabase já devolve a sessão.
  if (data.session) redirect("/");

  return { message: "Conta criada! Verifique seu e-mail para confirmar o cadastro." };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
