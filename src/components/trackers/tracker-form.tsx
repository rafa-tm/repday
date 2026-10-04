"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Check, CircleAlert } from "lucide-react";
import type { DoseUnit, Frequency, Tracker } from "@/db/schema";
import type { TrackerFormState } from "@/app/items/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  defaultDoseTimes,
  DOSE_UNITS,
  FREQUENCY_LABELS,
  MAX_DOSES_PER_DAY,
  readableTextColor,
  TRACKER_COLORS,
  WEEKDAYS,
} from "@/lib/trackers";

type Action = (state: TrackerFormState, formData: FormData) => Promise<TrackerFormState>;

export function TrackerForm({
  action,
  tracker,
}: {
  action: Action;
  tracker?: Tracker;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  // Campos controlados: o React reseta inputs não controlados após a action, o que apagaria o form em caso de erro.
  const [name, setName] = useState(tracker?.name ?? "");
  const [color, setColor] = useState(tracker?.color ?? TRACKER_COLORS[0]);
  const [doseAmount, setDoseAmount] = useState(tracker ? String(tracker.doseAmount).replace(".", ",") : "1");
  const [doseUnit, setDoseUnit] = useState<DoseUnit>(tracker?.doseUnit ?? "comprimido");
  const [doseTimes, setDoseTimes] = useState<string[]>(tracker?.doseTimes ?? defaultDoseTimes(1));
  const [frequency, setFrequency] = useState<Frequency>(tracker?.frequency ?? "daily");
  const [weekdays, setWeekdays] = useState<string[]>(
    (tracker?.weekdays ?? [1, 2, 3, 4, 5]).map(String),
  );
  const [intervalDays, setIntervalDays] = useState(String(tracker?.intervalDays && tracker.intervalDays > 1 ? tracker.intervalDays : 2));
  const [remindersEnabled, setRemindersEnabled] = useState(tracker?.remindersEnabled ?? false);

  function changeDoseCount(value: string) {
    const count = Math.min(Math.max(Number(value) || 1, 1), MAX_DOSES_PER_DAY);
    if (count !== doseTimes.length) setDoseTimes(defaultDoseTimes(count));
  }

  const isCustomColor = !TRACKER_COLORS.includes(color);

  return (
    <form action={formAction}>
      <Card>
        <CardHeader>
          <CardTitle>{tracker ? "Editar item" : "Novo item"}</CardTitle>
          <CardDescription>
            Um remédio, vitamina ou qualquer hábito que você queira acompanhar todo dia.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              name="name"
              placeholder="Ex.: Vitamina D"
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
              <label
                className="relative flex size-8 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-dashed border-border ring-offset-2 ring-offset-background has-focus-visible:ring-2 has-focus-visible:ring-ring data-[active=true]:ring-2 data-[active=true]:ring-foreground"
                data-active={isCustomColor}
                style={isCustomColor ? { backgroundColor: color } : undefined}
                title="Cor personalizada"
              >
                <span className="sr-only">Cor personalizada</span>
                {!isCustomColor && <span className="text-xs text-muted-foreground">+</span>}
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
              </label>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="doseAmount">Quantidade por dose</Label>
              <Input
                id="doseAmount"
                name="doseAmount"
                inputMode="decimal"
                value={doseAmount}
                onChange={(e) => setDoseAmount(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="doseUnit">Unidade</Label>
              <Select name="doseUnit" value={doseUnit} onValueChange={(v) => setDoseUnit(v as DoseUnit)}>
                <SelectTrigger id="doseUnit" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DOSE_UNITS).map(([value, { plural }]) => (
                    <SelectItem key={value} value={value}>
                      {plural}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="dosesPerDay">Doses por dia</Label>
              <Input
                id="dosesPerDay"
                name="dosesPerDay"
                type="number"
                min={1}
                max={MAX_DOSES_PER_DAY}
                value={doseTimes.length}
                onChange={(e) => changeDoseCount(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="frequency">Repetição</Label>
              <Select name="frequency" value={frequency} onValueChange={(v) => setFrequency(v as Frequency)}>
                <SelectTrigger id="frequency" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FREQUENCY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {frequency === "weekly" && (
            <div className="flex flex-col gap-2">
              <Label>Dias da semana</Label>
              {weekdays.map((d) => (
                <input key={d} type="hidden" name="weekdays" value={d} />
              ))}
              <ToggleGroup
                type="multiple"
                variant="outline"
                value={weekdays}
                onValueChange={setWeekdays}
                className="flex-wrap justify-start"
              >
                {WEEKDAYS.map((d) => (
                  <ToggleGroupItem
                    key={d.value}
                    value={String(d.value)}
                    aria-label={d.short}
                    className="data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                  >
                    {d.short}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          )}

          {frequency === "interval" && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="intervalDays">A cada quantos dias?</Label>
              <Input
                id="intervalDays"
                name="intervalDays"
                type="number"
                min={2}
                max={365}
                value={intervalDays}
                onChange={(e) => setIntervalDays(e.target.value)}
                className="sm:max-w-40"
                required
              />
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label>{doseTimes.length > 1 ? "Horários das doses" : "Horário da dose"}</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {doseTimes.map((time, i) => (
                <Input
                  key={i}
                  type="time"
                  name="doseTimes"
                  aria-label={`Horário da dose ${i + 1}`}
                  value={time}
                  onChange={(e) =>
                    setDoseTimes((times) => times.map((t, j) => (j === i ? e.target.value : t)))
                  }
                  required
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
            <div className="flex flex-col gap-0.5">
              <Label htmlFor="remindersEnabled">Lembretes</Label>
              <span className="text-sm text-muted-foreground">Receber notificação no horário de cada dose.</span>
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
            {pending ? "Salvando..." : tracker ? "Salvar" : "Criar item"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
