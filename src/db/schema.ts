import { authUsers } from "drizzle-orm/supabase";
import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  doublePrecision,
  index,
  integer,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const frequencyEnum = pgEnum("frequency", ["daily", "weekly", "interval"]);
export const doseUnitEnum = pgEnum("dose_unit", [
  "comprimido",
  "capsula",
  "mg",
  "ml",
  "gota",
  "unidade",
]);

export const trackerKindEnum = pgEnum("tracker_kind", ["custom", "water"]);
export const sexEnum = pgEnum("sex", ["male", "female", "other"]);

// RLS habilitado sem policies: bloqueia a Data API do Supabase; o Drizzle (role postgres) ignora RLS.

export const trackers = pgTable(
  "trackers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    // "water" é o item de hidratação criado a partir do perfil (meta recalculada quando o perfil muda).
    kind: trackerKindEnum("kind").notNull().default("custom"),
    name: text("name").notNull(),
    color: text("color").notNull(),
    dosesPerDay: smallint("doses_per_day").notNull().default(1),
    // Um horário "HH:MM" por dose, em ordem.
    doseTimes: text("dose_times").array().notNull(),
    frequency: frequencyEnum("frequency").notNull().default("daily"),
    // 0 = domingo ... 6 = sábado (usado quando frequency = "weekly").
    weekdays: smallint("weekdays").array().notNull().default([]),
    // A cada N dias a partir de startDate (usado quando frequency = "interval").
    intervalDays: integer("interval_days").notNull().default(1),
    // Na água, doseAmount é o tamanho do copo (ml) e dosesPerDay = ceil(goalMl / copo).
    doseAmount: doublePrecision("dose_amount").notNull(),
    // Meta diária em ml (só no item de água; é um mínimo, dá para tomar mais copos).
    goalMl: integer("goal_ml"),
    doseUnit: doseUnitEnum("dose_unit").notNull(),
    remindersEnabled: boolean("reminders_enabled").notNull().default(false),
    startDate: date("start_date", { mode: "string" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("trackers_user_id_idx").on(t.userId),
    uniqueIndex("trackers_user_water_uq").on(t.userId).where(sql`${t.kind} = 'water'`),
  ],
).enableRLS();

export const doseLogs = pgTable(
  "dose_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    trackerId: uuid("tracker_id")
      .notNull()
      .references(() => trackers.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    // Dia local do usuário a que a dose pertence.
    date: date("date", { mode: "string" }).notNull(),
    doseIndex: smallint("dose_index").notNull(),
    takenAt: timestamp("taken_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("dose_logs_tracker_date_dose_uq").on(t.trackerId, t.date, t.doseIndex),
    index("dose_logs_user_date_idx").on(t.userId, t.date),
  ],
).enableRLS();

export const profiles = pgTable("profiles", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  heightCm: smallint("height_cm").notNull(),
  weightKg: doublePrecision("weight_kg").notNull(),
  sex: sexEnum("sex").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();

export type Tracker = typeof trackers.$inferSelect;
export type NewTracker = typeof trackers.$inferInsert;
export type DoseUnit = (typeof doseUnitEnum.enumValues)[number];
export type Sex = (typeof sexEnum.enumValues)[number];
export type Profile = typeof profiles.$inferSelect;
export type Frequency = (typeof frequencyEnum.enumValues)[number];
