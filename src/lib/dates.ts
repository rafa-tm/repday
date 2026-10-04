// Datas de calendário como strings "YYYY-MM-DD", sem fuso: toda a aritmética é feita em UTC.

export const DEFAULT_TIME_ZONE = "America/Sao_Paulo";

export function isValidTimeZone(tz: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function todayIn(timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function toUTC(day: string) {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function addDays(day: string, amount: number) {
  const date = toUTC(day);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

/** 0 = domingo ... 6 = sábado */
export function dayOfWeek(day: string) {
  return toUTC(day).getUTCDay();
}

/** Quantidade de dias de `from` até `to` (negativo se `to` for antes). */
export function diffDays(from: string, to: string) {
  return Math.round((toUTC(to).getTime() - toUTC(from).getTime()) / 86_400_000);
}

const longFormat = new Intl.DateTimeFormat("pt-BR", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/** Ex.: "sáb., 3 de out. de 2026" */
export function formatDayLong(day: string) {
  return longFormat.format(toUTC(day));
}

const headingFormat = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

/** Ex.: "Sábado, 3 de outubro" */
export function formatDayHeading(day: string) {
  const text = headingFormat.format(toUTC(day));
  return text.charAt(0).toUpperCase() + text.slice(1);
}

const monthFormat = new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone: "UTC" });

export function formatMonthShort(day: string) {
  return monthFormat.format(toUTC(day)).replace(".", "");
}
