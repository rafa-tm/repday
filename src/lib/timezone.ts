import "server-only";
import { cookies } from "next/headers";
import { DEFAULT_TIME_ZONE, isValidTimeZone } from "./dates";

export const TIME_ZONE_COOKIE = "tz";

/** Fuso do navegador do usuário (sincronizado via cookie pelo <TimeZoneSync />). */
export async function getTimeZone() {
  const tz = (await cookies()).get(TIME_ZONE_COOKIE)?.value;
  return tz && isValidTimeZone(tz) ? tz : DEFAULT_TIME_ZONE;
}
