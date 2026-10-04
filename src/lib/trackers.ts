import type { DoseUnit, Frequency, Tracker } from "@/db/schema";
import { addDays, dayOfWeek, diffDays } from "./dates";

export const MAX_DOSES_PER_DAY = 12;

export const TRACKER_COLORS = [
  "#16a34a",
  "#0ea5e9",
  "#6366f1",
  "#a855f7",
  "#ec4899",
  "#ef4444",
  "#f97316",
  "#ca8a04",
];

export const FREQUENCY_LABELS: Record<Frequency, string> = {
  daily: "Todos os dias",
  weekly: "Dias da semana",
  interval: "A cada N dias",
};

export const DOSE_UNITS: Record<DoseUnit, { singular: string; plural: string }> = {
  comprimido: { singular: "comprimido", plural: "comprimidos" },
  capsula: { singular: "cápsula", plural: "cápsulas" },
  mg: { singular: "mg", plural: "mg" },
  ml: { singular: "ml", plural: "ml" },
  gota: { singular: "gota", plural: "gotas" },
  unidade: { singular: "unidade", plural: "unidades" },
};

export const WEEKDAYS = [
  { value: 0, short: "Dom", initial: "D" },
  { value: 1, short: "Seg", initial: "S" },
  { value: 2, short: "Ter", initial: "T" },
  { value: 3, short: "Qua", initial: "Q" },
  { value: 4, short: "Qui", initial: "Q" },
  { value: 5, short: "Sex", initial: "S" },
  { value: 6, short: "Sáb", initial: "S" },
];

type Schedule = Pick<Tracker, "frequency" | "weekdays" | "intervalDays" | "startDate">;

export function isScheduledOn(tracker: Schedule, day: string) {
  if (day < tracker.startDate) return false;
  switch (tracker.frequency) {
    case "daily":
      return true;
    case "weekly":
      return tracker.weekdays.includes(dayOfWeek(day));
    case "interval":
      return diffDays(tracker.startDate, day) % tracker.intervalDays === 0;
  }
}

export function describeSchedule(tracker: Schedule) {
  switch (tracker.frequency) {
    case "daily":
      return "Todos os dias";
    case "weekly": {
      const days = [...tracker.weekdays].sort();
      if (days.length === 7) return "Todos os dias";
      if (days.join() === "1,2,3,4,5") return "Dias úteis";
      if (days.join() === "0,6") return "Fins de semana";
      return days.map((d) => WEEKDAYS[d].short).join(", ");
    }
    case "interval":
      return `A cada ${tracker.intervalDays} dias`;
  }
}

const amountFormat = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });

export function formatDose(amount: number, unit: DoseUnit) {
  const label = amount === 1 ? DOSE_UNITS[unit].singular : DOSE_UNITS[unit].plural;
  return `${amountFormat.format(amount)} ${label}`;
}

/** Distribui as doses entre 08:00 e 22:00, arredondando para 30 min. */
export function defaultDoseTimes(count: number) {
  if (count <= 1) return ["08:00"];
  const start = 8 * 60;
  const span = 14 * 60;
  return Array.from({ length: count }, (_, i) => {
    const minutes = Math.round((start + (span * i) / (count - 1)) / 30) * 30;
    return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
  });
}

/** Texto legível (preto ou branco) sobre uma cor hex. */
export function readableTextColor(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62 ? "#0a0a0a" : "#ffffff";
}

export type DayStatus =
  | { kind: "future" }
  | { kind: "inactive" }
  | { kind: "off" }
  | { kind: "scheduled"; taken: number; total: number };

export function dayStatus(
  tracker: Schedule & Pick<Tracker, "dosesPerDay">,
  day: string,
  today: string,
  takenOn: (day: string) => number,
): DayStatus {
  if (day > today) return { kind: "future" };
  if (day < tracker.startDate) return { kind: "inactive" };
  if (!isScheduledOn(tracker, day)) return { kind: "off" };
  return {
    kind: "scheduled",
    taken: Math.min(takenOn(day), tracker.dosesPerDay),
    total: tracker.dosesPerDay,
  };
}

/** Dias seguidos com todas as doses tomadas (dias sem dose programada não quebram a sequência). */
export function currentStreak(
  tracker: Schedule & Pick<Tracker, "dosesPerDay">,
  today: string,
  takenOn: (day: string) => number,
) {
  let streak = 0;
  let day = today;
  // Hoje ainda em andamento não quebra a sequência.
  const todayStatus = dayStatus(tracker, today, today, takenOn);
  if (todayStatus.kind === "scheduled" && todayStatus.taken < todayStatus.total) {
    day = addDays(today, -1);
  }
  while (day >= tracker.startDate) {
    const status = dayStatus(tracker, day, today, takenOn);
    if (status.kind === "scheduled") {
      if (status.taken < status.total) break;
      streak++;
    }
    day = addDays(day, -1);
  }
  return streak;
}

/** % de doses tomadas nos últimos `days` dias (sem contar hoje). `null` se não houve doses programadas. */
export function adherence(
  tracker: Schedule & Pick<Tracker, "dosesPerDay">,
  today: string,
  takenOn: (day: string) => number,
  days = 30,
) {
  let taken = 0;
  let expected = 0;
  for (let i = 1; i <= days; i++) {
    const status = dayStatus(tracker, addDays(today, -i), today, takenOn);
    if (status.kind === "scheduled") {
      taken += status.taken;
      expected += status.total;
    }
  }
  return expected === 0 ? null : Math.round((taken / expected) * 100);
}
