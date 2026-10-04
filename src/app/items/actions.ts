"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { doseLogs, doseUnitEnum, frequencyEnum, trackers } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { todayIn } from "@/lib/dates";
import { getTimeZone } from "@/lib/timezone";
import { defaultDoseTimes, isScheduledOn, MAX_DOSES_PER_DAY } from "@/lib/trackers";
import { MAX_CUPS_PER_DAY, waterPlan } from "@/lib/water";

export type TrackerFormState = { error?: string } | undefined;

const trackerSchema = z
  .object({
    name: z.string().trim().min(1, "Dê um nome ao item.").max(60, "Nome muito longo."),
    color: z.string().regex(/^#[0-9a-f]{6}$/i, "Cor inválida."),
    doseAmount: z.coerce.number("Informe a quantidade.").positive("A quantidade deve ser maior que zero.").max(100_000),
    doseUnit: z.enum(doseUnitEnum.enumValues, "Escolha a unidade."),
    dosesPerDay: z.coerce.number().int().min(1).max(MAX_DOSES_PER_DAY),
    doseTimes: z.array(z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Horário inválido.")),
    frequency: z.enum(frequencyEnum.enumValues),
    weekdays: z.array(z.coerce.number().int().min(0).max(6)),
    intervalDays: z.coerce.number().int().min(2, "O intervalo mínimo é de 2 dias.").max(365),
    remindersEnabled: z.boolean(),
  })
  .refine((v) => v.doseTimes.length === v.dosesPerDay, "Defina um horário para cada dose.")
  .refine((v) => v.frequency !== "weekly" || v.weekdays.length > 0, "Escolha pelo menos um dia da semana.");

function parseTrackerForm(formData: FormData) {
  const frequency = formData.get("frequency");
  const result = trackerSchema.safeParse({
    name: formData.get("name"),
    color: formData.get("color"),
    doseAmount: String(formData.get("doseAmount") ?? "").replace(",", "."),
    doseUnit: formData.get("doseUnit"),
    dosesPerDay: formData.get("dosesPerDay"),
    doseTimes: formData.getAll("doseTimes"),
    frequency,
    weekdays: frequency === "weekly" ? [...new Set(formData.getAll("weekdays"))] : [],
    intervalDays: frequency === "interval" ? formData.get("intervalDays") : 2,
    remindersEnabled: formData.get("remindersEnabled") === "on",
  });
  if (!result.success) return { error: result.error.issues[0].message } as const;

  const data = result.data;
  return {
    data: {
      ...data,
      doseTimes: [...data.doseTimes].sort(),
      weekdays: [...data.weekdays].sort(),
      intervalDays: data.frequency === "interval" ? data.intervalDays : 1,
    },
  } as const;
}

export async function createTracker(_prev: TrackerFormState, formData: FormData): Promise<TrackerFormState> {
  const user = await requireUser();
  const parsed = parseTrackerForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  await db.insert(trackers).values({
    ...parsed.data,
    userId: user.id,
    startDate: todayIn(await getTimeZone()),
  });

  revalidatePath("/");
  redirect("/");
}

export async function updateTracker(
  id: string,
  _prev: TrackerFormState,
  formData: FormData,
): Promise<TrackerFormState> {
  const user = await requireUser();
  const parsed = parseTrackerForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const updated = await db
    .update(trackers)
    .set(parsed.data)
    .where(and(eq(trackers.id, id), eq(trackers.userId, user.id), eq(trackers.kind, "custom")))
    .returning({ id: trackers.id });
  if (updated.length === 0) return { error: "Item não encontrado." };

  revalidatePath("/");
  redirect("/");
}

export async function deleteTracker(id: string) {
  const user = await requireUser();
  await db.delete(trackers).where(and(eq(trackers.id, id), eq(trackers.userId, user.id)));
  revalidatePath("/");
}

export async function toggleDose(trackerId: string, day: string, doseIndex: number) {
  const user = await requireUser();

  const [tracker] = await db
    .select()
    .from(trackers)
    .where(and(eq(trackers.id, trackerId), eq(trackers.userId, user.id)));
  if (!tracker || tracker.kind === "water") throw new Error("Item não encontrado.");

  const today = todayIn(await getTimeZone());
  const validDose = Number.isInteger(doseIndex) && doseIndex >= 0 && doseIndex < tracker.dosesPerDay;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || day > today || !isScheduledOn(tracker, day) || !validDose) {
    throw new Error("Dose inválida.");
  }

  const match = and(
    eq(doseLogs.trackerId, trackerId),
    eq(doseLogs.date, day),
    eq(doseLogs.doseIndex, doseIndex),
  );
  const removed = await db.delete(doseLogs).where(match).returning({ id: doseLogs.id });
  if (removed.length === 0) {
    await db
      .insert(doseLogs)
      .values({ trackerId, userId: user.id, date: day, doseIndex })
      .onConflictDoNothing();
  }

  revalidatePath("/");
}

const waterSchema = z.object({
  name: z.string().trim().min(1, "Dê um nome ao item.").max(60, "Nome muito longo."),
  color: z.string().regex(/^#[0-9a-f]{6}$/i, "Cor inválida."),
  cupMl: z.coerce
    .number("Informe o tamanho do copo.")
    .int("Use o tamanho do copo em ml, sem vírgula.")
    .min(50, "O copo deve ter entre 50 e 2000 ml.")
    .max(2000, "O copo deve ter entre 50 e 2000 ml."),
  goalMl: z.coerce.number("Informe a meta diária.").min(0.1, "Informe a meta diária."),
  remindersEnabled: z.boolean(),
});

export async function updateWaterTracker(
  id: string,
  _prev: TrackerFormState,
  formData: FormData,
): Promise<TrackerFormState> {
  const user = await requireUser();
  const parsed = waterSchema.safeParse({
    name: formData.get("name"),
    color: formData.get("color"),
    cupMl: formData.get("cupMl"),
    goalMl: String(formData.get("goalLiters") ?? "").replace(",", "."),
    remindersEnabled: formData.get("remindersEnabled") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { cupMl, goalMl: goalLiters, ...rest } = parsed.data;
  const goalMl = Math.round(goalLiters * 1000);
  if (goalMl > 10_000) return { error: "A meta deve ser de até 10 L por dia." };
  const plan = waterPlan(goalMl, cupMl);

  const updated = await db
    .update(trackers)
    .set({ ...rest, ...plan, doseTimes: defaultDoseTimes(plan.dosesPerDay) })
    .where(and(eq(trackers.id, id), eq(trackers.userId, user.id), eq(trackers.kind, "water")))
    .returning({ id: trackers.id });
  if (updated.length === 0) return { error: "Item não encontrado." };

  revalidatePath("/");
  redirect("/");
}

async function requireTodayWaterTracker(trackerId: string, day: string) {
  const user = await requireUser();
  const [tracker] = await db
    .select({ id: trackers.id })
    .from(trackers)
    .where(and(eq(trackers.id, trackerId), eq(trackers.userId, user.id), eq(trackers.kind, "water")));
  if (!tracker) throw new Error("Item não encontrado.");
  if (day !== todayIn(await getTimeZone())) throw new Error("Só é possível registrar copos de hoje.");
  return user;
}

/** Registra mais um copo no dia (cada copo é um dose_log com índice sequencial). */
export async function addCup(trackerId: string, day: string) {
  const user = await requireTodayWaterTracker(trackerId, day);
  const [last] = await db
    .select({ doseIndex: doseLogs.doseIndex })
    .from(doseLogs)
    .where(and(eq(doseLogs.trackerId, trackerId), eq(doseLogs.date, day)))
    .orderBy(desc(doseLogs.doseIndex))
    .limit(1);
  const next = last ? last.doseIndex + 1 : 0;
  if (next >= MAX_CUPS_PER_DAY) return;

  await db
    .insert(doseLogs)
    .values({ trackerId, userId: user.id, date: day, doseIndex: next })
    .onConflictDoNothing();
  revalidatePath("/");
}

/** Remove o último copo registrado no dia. */
export async function removeCup(trackerId: string, day: string) {
  await requireTodayWaterTracker(trackerId, day);
  const [last] = await db
    .select({ id: doseLogs.id })
    .from(doseLogs)
    .where(and(eq(doseLogs.trackerId, trackerId), eq(doseLogs.date, day)))
    .orderBy(desc(doseLogs.doseIndex))
    .limit(1);
  if (last) await db.delete(doseLogs).where(eq(doseLogs.id, last.id));
  revalidatePath("/");
}
