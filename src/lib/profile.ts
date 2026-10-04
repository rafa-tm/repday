import "server-only";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { profiles, trackers } from "@/db/schema";
import { todayIn } from "./dates";
import { getTimeZone } from "./timezone";
import { defaultDoseTimes } from "./trackers";
import { recommendedWaterMl, waterPlan, type BodyData } from "./water";

export const WATER_COLOR = "#0ea5e9";

export async function getProfile(userId: string) {
  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));
  return profile;
}

/** Garante que o usuário já respondeu altura/peso/sexo. */
export async function requireProfile(userId: string) {
  const profile = await getProfile(userId);
  if (!profile) redirect("/onboarding");
  return profile;
}

/**
 * Salva o perfil e mantém o item "Água" em dia com a meta recomendada.
 * O item é criado junto com o primeiro perfil; depois a meta volta para a recomendada mantendo o
 * tamanho do copo escolhido (se o usuário excluiu o item, ele não volta).
 */
export async function saveProfile(userId: string, body: BodyData) {
  const goalMl = recommendedWaterMl(body);
  const startDate = todayIn(await getTimeZone());

  await db.transaction(async (tx) => {
    const [existing] = await tx.select().from(profiles).where(eq(profiles.userId, userId));

    if (existing) {
      await tx.update(profiles).set({ ...body, updatedAt: new Date() }).where(eq(profiles.userId, userId));
      const [water] = await tx
        .select()
        .from(trackers)
        .where(and(eq(trackers.userId, userId), eq(trackers.kind, "water")));
      if (water) {
        const plan = waterPlan(goalMl, water.doseAmount);
        await tx
          .update(trackers)
          .set({ ...plan, doseTimes: defaultDoseTimes(plan.dosesPerDay) })
          .where(eq(trackers.id, water.id));
      }
      return;
    }

    await tx.insert(profiles).values({ userId, ...body });
    const plan = waterPlan(goalMl);
    await tx
      .insert(trackers)
      .values({
        userId,
        kind: "water",
        name: "Água",
        color: WATER_COLOR,
        ...plan,
        doseUnit: "ml",
        doseTimes: defaultDoseTimes(plan.dosesPerDay),
        frequency: "daily",
        startDate,
      })
      .onConflictDoNothing();
  });

  return goalMl;
}
