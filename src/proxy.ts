import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Arquivos públicos (inclusive os do PWA) não passam pela checagem de login.
    "/((?!_next/static|_next/image|favicon.ico|sw.js|offline.html|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
