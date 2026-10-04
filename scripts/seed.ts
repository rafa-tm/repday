/**
 * Cria (ou recria) um usuário de teste com perfil, item de água, outros itens e ~10 meses de histórico.
 *
 *   npm run db:seed           # recria o usuário de teste do zero
 *   npm run db:seed -- --reset   # só remove o usuário de teste (e tudo dele)
 *
 * Credenciais: SEED_USER_EMAIL / SEED_USER_PASSWORD (padrão: teste@repday.dev / repday123).
 */
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { doseLogs, profiles, trackers, type NewTracker } from "@/db/schema";
import { addDays, DEFAULT_TIME_ZONE, todayIn } from "@/lib/dates";
import { defaultDoseTimes, isScheduledOn } from "@/lib/trackers";
import { recommendedWaterMl, waterPlan, type BodyData } from "@/lib/water";

config({ path: ".env.local", quiet: true });

const EMAIL = process.env.SEED_USER_EMAIL ?? "teste@repday.dev";
const PASSWORD = process.env.SEED_USER_PASSWORD ?? "repday123";
const HISTORY_DAYS = 300;

const client = postgres(process.env.DATABASE_URL!, { prepare: false, max: 1 });
const db = drizzle(client);

// PRNG determinístico: o histórico sai igual a cada execução (no mesmo dia).
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const random = mulberry32(42);

async function deleteSeedUser() {
  // trackers e dose_logs são apagados em cascata.
  const removed = await client`delete from auth.users where email = ${EMAIL} returning id`;
  return removed.length;
}

async function createSeedUser() {
  const [user] = await client<{ id: string }[]>`
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
      ${EMAIL}, extensions.crypt(${PASSWORD}, extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''
    ) returning id`;

  await client`
    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (
      ${user.id}, ${user.id},
      ${JSON.stringify({ sub: user.id, email: EMAIL, email_verified: true })}::jsonb,
      'email', now(), now(), now()
    )`;

  return user.id;
}

type SeedTracker = Omit<NewTracker, "userId" | "startDate"> & {
  /** Dias atrás em que o acompanhamento começou. */
  startedDaysAgo: number;
  /** Probabilidade de cada dose ter sido tomada. */
  adherence: number;
};

const SEED_BODY: BodyData = { heightCm: 165, weightKg: 62, sex: "female" };
const waterGoal = waterPlan(recommendedWaterMl(SEED_BODY));

const SEED_TRACKERS: SeedTracker[] = [
  {
    kind: "water",
    name: "Água",
    color: "#0ea5e9",
    ...waterGoal,
    doseTimes: defaultDoseTimes(waterGoal.dosesPerDay),
    frequency: "daily",
    doseUnit: "ml",
    startedDaysAgo: HISTORY_DAYS,
    adherence: 0.75, // na água: chance de bater a meta no dia
  },
  {
    name: "Losartana",
    color: "#16a34a",
    dosesPerDay: 2,
    doseTimes: ["08:00", "20:00"],
    frequency: "daily",
    doseAmount: 50,
    doseUnit: "mg",
    remindersEnabled: true,
    startedDaysAgo: HISTORY_DAYS,
    adherence: 0.88,
  },
  {
    name: "Vitamina D",
    color: "#f97316",
    dosesPerDay: 1,
    doseTimes: ["09:00"],
    frequency: "weekly",
    weekdays: [1, 3, 5],
    doseAmount: 1,
    doseUnit: "capsula",
    startedDaysAgo: 240,
    adherence: 0.8,
  },
  {
    name: "Ômega 3",
    color: "#6366f1",
    dosesPerDay: 3,
    doseTimes: ["08:00", "14:00", "22:00"],
    frequency: "daily",
    doseAmount: 1,
    doseUnit: "comprimido",
    startedDaysAgo: 120,
    adherence: 0.7,
  },
  {
    name: "Vitamina B12",
    color: "#ec4899",
    dosesPerDay: 1,
    doseTimes: ["10:00"],
    frequency: "interval",
    intervalDays: 3,
    doseAmount: 20,
    doseUnit: "gota",
    startedDaysAgo: 90,
    adherence: 0.95,
  },
];

async function main() {
  const removed = await deleteSeedUser();
  if (removed) console.log(`Usuário de teste anterior removido (${EMAIL}).`);
  if (process.argv.includes("--reset")) return;

  const userId = await createSeedUser();
  await db.insert(profiles).values({ userId, ...SEED_BODY });
  const today = todayIn(DEFAULT_TIME_ZONE);
  let doseCount = 0;

  for (const { startedDaysAgo, adherence, ...data } of SEED_TRACKERS) {
    const startDate = addDays(today, -startedDaysAgo);
    const [tracker] = await db
      .insert(trackers)
      .values({ ...data, userId, startDate })
      .returning();

    const logs: (typeof doseLogs.$inferInsert)[] = [];
    // Até ontem: hoje fica em aberto para testar a marcação.
    for (let day = startDate; day < today; day = addDays(day, 1)) {
      if (!isScheduledOn(tracker, day)) continue;
      if (tracker.kind === "water") {
        // Copos no dia: bate a meta (às vezes passa dela) ou fica um pouco abaixo.
        const goal = tracker.dosesPerDay;
        const cups =
          random() < adherence
            ? goal + Math.floor(random() * 4)
            : Math.floor(goal * (0.3 + random() * 0.6));
        for (let doseIndex = 0; doseIndex < cups; doseIndex++) {
          logs.push({ trackerId: tracker.id, userId, date: day, doseIndex });
        }
        continue;
      }
      for (let doseIndex = 0; doseIndex < tracker.dosesPerDay; doseIndex++) {
        if (random() < adherence) logs.push({ trackerId: tracker.id, userId, date: day, doseIndex });
      }
    }
    if (logs.length) await db.insert(doseLogs).values(logs);
    doseCount += logs.length;
  }

  console.log(`Usuário de teste criado: ${EMAIL} / ${PASSWORD}`);
  console.log(`${SEED_TRACKERS.length} itens, ${doseCount} doses registradas.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => client.end());
