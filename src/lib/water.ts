import { z } from "zod";
import type { Sex } from "@/db/schema";

export const SEX_OPTIONS: { value: Sex; label: string }[] = [
  { value: "female", label: "Feminino" },
  { value: "male", label: "Masculino" },
  { value: "other", label: "Outro" },
];

export const bodySchema = z.object({
  heightCm: z.coerce
    .number("Informe a altura em centímetros (ex.: 175).")
    .int("Use a altura em centímetros, sem vírgula.")
    .min(100, "Altura deve estar entre 100 e 250 cm.")
    .max(250, "Altura deve estar entre 100 e 250 cm."),
  weightKg: z.coerce
    .number("Informe seu peso.")
    .min(30, "Peso deve estar entre 30 e 300 kg.")
    .max(300, "Peso deve estar entre 30 e 300 kg."),
  sex: z.enum(["male", "female", "other"], "Escolha o sexo."),
});

export type BodyData = z.infer<typeof bodySchema>;

/** Aceita vírgula decimal e altura em metros ("1,80" → 180). */
export function normalizeBodyInput(input: { heightCm: unknown; weightKg: unknown; sex: unknown }) {
  const height = Number(String(input.heightCm ?? "").trim().replace(",", "."));
  return {
    heightCm: height > 0 && height < 3 ? Math.round(height * 100) : String(input.heightCm ?? "").trim(),
    weightKg: String(input.weightKg ?? "").trim().replace(",", "."),
    sex: input.sex,
  };
}

export function parseBodyForm(formData: FormData) {
  return bodySchema.safeParse(
    normalizeBodyInput({
      heightCm: formData.get("heightCm"),
      weightKg: formData.get("weightKg"),
      sex: formData.get("sex"),
    }),
  );
}

const ML_PER_KG = 35;
const MAX_WATER_ML = 5000;
// Ingestão mínima de água por bebidas (EFSA): 2,5 L homens, 2,0 L mulheres.
const MIN_WATER_ML: Record<Sex, number> = { male: 2500, female: 2000, other: 2250 };
// Fórmula de Devine para peso ideal.
const IDEAL_WEIGHT_BASE: Record<Sex, number> = { male: 50, female: 45.5, other: 47.75 };

export function bmi({ heightCm, weightKg }: Pick<BodyData, "heightCm" | "weightKg">) {
  return weightKg / (heightCm / 100) ** 2;
}

/**
 * Meta diária de água em ml: 35 ml por kg, usando o peso ajustado quando IMC ≥ 30
 * (peso ideal + 40% do excedente), com mínimo por sexo e teto de 5 L. Arredonda para 100 ml.
 */
export function recommendedWaterMl(body: BodyData) {
  let weight = body.weightKg;
  if (bmi(body) >= 30) {
    const ideal = IDEAL_WEIGHT_BASE[body.sex] + 0.91 * (body.heightCm - 152.4);
    weight = ideal + 0.4 * (body.weightKg - ideal);
  }
  const ml = Math.min(Math.max(weight * ML_PER_KG, MIN_WATER_ML[body.sex]), MAX_WATER_ML);
  return Math.round(ml / 100) * 100;
}

export const DEFAULT_CUP_ML = 250;
export const MAX_CUPS_PER_DAY = 40;

/** Quantos copos são necessários para bater a meta (a meta é um mínimo). */
export function cupsForGoal(goalMl: number, cupMl: number) {
  return Math.min(Math.max(Math.ceil(goalMl / cupMl), 1), MAX_CUPS_PER_DAY);
}

/** Campos do item de água a partir da meta e do tamanho do copo. */
export function waterPlan(goalMl: number, cupMl = DEFAULT_CUP_ML) {
  return { goalMl, doseAmount: cupMl, dosesPerDay: cupsForGoal(goalMl, cupMl) };
}

const litersFormat = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });

export function formatLiters(ml: number) {
  return `${litersFormat.format(ml / 1000)} L`;
}

/** Meta diária do item de água (itens antigos sem goalMl usam copos × tamanho). */
export function waterGoalMl(tracker: { goalMl: number | null; doseAmount: number; dosesPerDay: number }) {
  return tracker.goalMl ?? tracker.doseAmount * tracker.dosesPerDay;
}
