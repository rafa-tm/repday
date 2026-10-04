"use client";

import { useState } from "react";
import { Droplet } from "lucide-react";
import type { Sex } from "@/db/schema";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  bodySchema,
  formatLiters,
  normalizeBodyInput,
  recommendedWaterMl,
  SEX_OPTIONS,
  waterPlan,
} from "@/lib/water";

export type BodyDefaults = { heightCm?: number; weightKg?: number; sex?: Sex };

/**
 * Campos de altura, peso e sexo com prévia da meta de água. Controlados para não resetarem após a action.
 * `waterCupMl`: copo do item "Água" já existente (undefined = o item será criado; null = não existe mais).
 */
export function BodyFields({ defaults, waterCupMl }: { defaults?: BodyDefaults; waterCupMl?: number | null }) {
  const [heightCm, setHeightCm] = useState(defaults?.heightCm ? String(defaults.heightCm) : "");
  const [weightKg, setWeightKg] = useState(
    defaults?.weightKg ? String(defaults.weightKg).replace(".", ",") : "",
  );
  const [sex, setSex] = useState<Sex | "">(defaults?.sex ?? "");

  const parsed = bodySchema.safeParse(normalizeBodyInput({ heightCm, weightKg, sex }));
  const goalMl = parsed.success ? recommendedWaterMl(parsed.data) : null;
  const plan = goalMl && waterCupMl !== null ? waterPlan(goalMl, waterCupMl) : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="heightCm">Altura (cm)</Label>
          <Input
            id="heightCm"
            name="heightCm"
            inputMode="numeric"
            placeholder="170"
            value={heightCm}
            onChange={(e) => setHeightCm(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="weightKg">Peso (kg)</Label>
          <Input
            id="weightKg"
            name="weightKg"
            inputMode="decimal"
            placeholder="70"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Sexo</Label>
        <input type="hidden" name="sex" value={sex} />
        <ToggleGroup
          type="single"
          variant="outline"
          value={sex}
          onValueChange={(v) => v && setSex(v as Sex)}
          className="w-full"
        >
          {SEX_OPTIONS.map((o) => (
            <ToggleGroupItem
              key={o.value}
              value={o.value}
              className="flex-1 data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              {o.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="flex items-start gap-3 rounded-lg border p-3 text-sm">
        <Droplet className="mt-0.5 size-4 shrink-0 text-sky-500" />
        {goalMl ? (
          <p>
            Recomendado: <strong className="font-medium">no mínimo {formatLiters(goalMl)} de água por dia</strong>
            {plan && (
              <span className="text-muted-foreground">
                {" "}
                — {plan.dosesPerDay} copos de {plan.doseAmount} ml.{" "}
                {waterCupMl === undefined
                  ? "Vamos criar esse item de acompanhamento para você."
                  : "O item “Água” será atualizado ao salvar."}
              </span>
            )}
          </p>
        ) : (
          <p className="text-muted-foreground">
            Preencha altura, peso e sexo para calcularmos quanta água você deve tomar por dia.
          </p>
        )}
      </div>
    </div>
  );
}
