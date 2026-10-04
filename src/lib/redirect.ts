import { NextResponse } from "next/server";

/** Redirect com Location relativo: mantém o host que o navegador usou (ex.: IP do WSL em dev). */
export function relativeRedirect(path: string) {
  return new NextResponse(null, { status: 307, headers: { Location: path } });
}
