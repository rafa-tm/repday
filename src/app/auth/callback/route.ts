import type { EmailOtpType } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import { relativeRedirect } from "@/lib/redirect";
import { createClient } from "@/lib/supabase/server";

// Recebe o link de confirmação de e-mail (PKCE `code` ou `token_hash`) e cria a sessão.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return relativeRedirect(safeNext);
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return relativeRedirect(safeNext);
  }

  return relativeRedirect("/login?error=auth");
}
