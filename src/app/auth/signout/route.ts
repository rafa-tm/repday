import { createClient } from "@/lib/supabase/server";
import { relativeRedirect } from "@/lib/redirect";

// Limpa os cookies de uma sessão inválida (ex.: usuário removido). Server Components não podem
// apagar cookies, e sem isso o proxy e a página ficariam redirecionando entre "/" e "/login".
export async function GET() {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  return relativeRedirect("/login");
}
