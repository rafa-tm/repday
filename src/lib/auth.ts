import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Fonte de verdade da autenticação (o proxy só faz o redirecionamento otimista).
export const getUser = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
});

export async function requireUser() {
  const user = await getUser();
  // Sem usuário válido aqui, mas o proxy pode ter visto um token ainda assinado: limpa a sessão.
  if (!user) redirect("/auth/signout");
  return user;
}
