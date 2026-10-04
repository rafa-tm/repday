"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Guarda o fuso do navegador num cookie para o servidor saber qual é o "hoje" do usuário. */
export function TimeZoneSync() {
  const router = useRouter();

  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const current = document.cookie
      .split("; ")
      .find((c) => c.startsWith("tz="))
      ?.slice(3);
    if (current && decodeURIComponent(current) === tz) return;
    document.cookie = `tz=${encodeURIComponent(tz)}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }, [router]);

  return null;
}
