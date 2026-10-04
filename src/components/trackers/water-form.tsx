"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Check, CircleAlert, GlassWater } from "lucide-react";
import type { Tracker } from "@/db/schema";
import type { TrackerFormState } from "@/app/items/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { readableTextColor, TRACKER_COLORS } from "@/lib/trackers";
import { cupsForGoal, formatLiters, waterGoalMl } from "@/lib/water";

type Action = (state: TrackerFormState, formData: FormData) => Promise<TrackerFormState>;

const CUP_PRESETS = [200, 250, 300, 500];

function litersInput(ml: number) {
  return String(ml / 1000).replace(".", ",");
}

export function WaterForm({
  action,
  tracker,
  recommendedMl,
}: {
  action: Action;
  tracker: Tracker;
  recommendedMl?: number;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  const [name, setName] = useState(tracker.name);
  const [color, setColor] = useState(tracker.color);
  const [cupMl, setCupMl] = useState(String(tracker.doseAmount));
  const [goalLiters, setGoalLiters] = useState(litersInput(waterGoalMl(tracker)));
  const [remindersEnabled, setRemindersEnabled] = useState(tracker.remindersEnabled);

  const cup = Number(cupMl);
  const goalMl = Math.round(Number(goalLiters.replace(",", ".")) * 1000);
  const cups = cup >= 50 && goalMl > 0 ? cupsForGoal(goalMl, cup) : null;
  const belowRecommended = recommendedMl !== undefined && goalMl > 0 && goalMl < recommendedMl;

  return (
    <form action={formAction}>
      <Card>
        <CardHeader>
          <CardTitle>Editar {tracker.name}</CardTitle>
          <CardDescription>
            Marque cada copo que tomar. A meta é um mínimo: dá para registrar mais copos no dia.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Cor</Label>
            <input type="hidden" name="color" value={color} />
            <div className="flex flex-wrap items-center gap-2">
              {TRACKER_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Cor ${c}`}
                  aria-pressed={color === c}
                  onClick={() => setColor(c)}
                  className="flex size-8 items-center justify-center rounded-full ring-offset-2 ring-offset-background outline-none focus-visible:ring-2 focus-visible:ring-ring aria-pressed:ring-2 aria-pressed:ring-foreground"
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check className="size-4" style={{ color: readableTextColor(c) }} />}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="cupMl">Tamanho do seu copo (ml)</Label>
            <div className="flex flex-wrap gap-2">
              <Input
                id="cupMl"
                name="cupMl"
                inputMode="numeric"
                value={cupMl}
                onChange={(e) => setCupMl(e.target.value)}
                className="w-28"
                required
              />
              {CUP_PRESETS.map((ml) => (
                <Button
                  key={ml}
                  type="button"
                  variant={cup === ml ? "default" : "outline"}
                  onClick={() => setCupMl(String(ml))}
                >
                  {ml} ml
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="goalLiters">Meta diária (litros)</Label>
            <Input
              id="goalLiters"
              name="goalLiters"
              inputMode="decimal"
              value={goalLiters}
              onChange={(e) => setGoalLiters(e.target.value)}
              className="w-28"
              required
            />
            {recommendedMl !== undefined && (
              <p className={belowRecommended ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>
                Recomendado para você: no mínimo {formatLiters(recommendedMl)} por dia
                {belowRecommended && " — sua meta está abaixo disso"}.{" "}
                <button
                  type="button"
                  className="underline underline-offset-4"
                  onClick={() => setGoalLiters(litersInput(recommendedMl))}
                >
                  Usar recomendado
                </button>
              </p>
            )}
          </div>

          {cups && (
            <div className="flex items-center gap-3 rounded-lg border p-3 text-sm">
              <GlassWater className="size-5 shrink-0" style={{ color }} />
              <p>
                <strong className="font-medium">
                  {cups} {cups === 1 ? "copo" : "copos"} de {cup} ml
                </strong>{" "}
                <span className="text-muted-foreground">para bater a meta de {formatLiters(goalMl)}.</span>
              </p>
            </div>
          )}

          <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
            <div className="flex flex-col gap-0.5">
              <Label htmlFor="remindersEnabled">Lembretes</Label>
              <span className="text-sm text-muted-foreground">Lembrar de beber água ao longo do dia.</span>
            </div>
            {remindersEnabled && <input type="hidden" name="remindersEnabled" value="on" />}
            <Switch id="remindersEnabled" checked={remindersEnabled} onCheckedChange={setRemindersEnabled} />
          </div>

          {state?.error && (
            <Alert variant="destructive">
              <CircleAlert />
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" asChild>
            <Link href="/">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Salvando..." : "Salvar"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
