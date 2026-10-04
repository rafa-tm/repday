"use client";

import { useOptimistic, useTransition } from "react";
import { GlassWater, Plus } from "lucide-react";
import { addCup, removeCup } from "@/app/items/actions";
import { Button } from "@/components/ui/button";
import { formatLiters, MAX_CUPS_PER_DAY } from "@/lib/water";
import { cn } from "@/lib/utils";

export function WaterCups({
  trackerId,
  day,
  taken,
  goalCups,
  cupMl,
  goalMl,
  color,
}: {
  trackerId: string;
  day: string;
  taken: number;
  goalCups: number;
  cupMl: number;
  goalMl: number;
  color: string;
}) {
  const [, startTransition] = useTransition();
  const [count, changeOptimistic] = useOptimistic(taken, (current, delta: number) =>
    Math.min(Math.max(current + delta, 0), MAX_CUPS_PER_DAY),
  );

  function change(delta: 1 | -1) {
    startTransition(async () => {
      changeOptimistic(delta);
      await (delta > 0 ? addCup(trackerId, day) : removeCup(trackerId, day));
    });
  }

  const drankMl = count * cupMl;
  const reached = drankMl >= goalMl;
  const slots = Math.max(goalCups, count);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-1">
        {Array.from({ length: slots }, (_, i) => {
          const filled = i < count;
          return (
            <button
              key={i}
              type="button"
              // Copo cheio: desfaz o último. Copo vazio: adiciona um.
              onClick={() => change(filled ? -1 : 1)}
              aria-label={filled ? "Remover um copo" : "Adicionar um copo"}
              className={cn(
                "flex size-9 items-center justify-center rounded-md transition-colors outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
                !filled && "text-muted-foreground/40",
                i >= goalCups && "bg-muted/60",
              )}
              style={filled ? { color } : undefined}
            >
              <GlassWater
                className="size-6"
                fill={filled ? `color-mix(in oklch, ${color} 35%, transparent)` : "none"}
              />
            </button>
          );
        })}
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="ml-1"
          onClick={() => change(1)}
          disabled={count >= MAX_CUPS_PER_DAY}
          aria-label="Adicionar um copo"
        >
          <Plus />
        </Button>
      </div>

      <p className="text-sm text-muted-foreground" aria-live="polite">
        <strong className="font-medium text-foreground tabular-nums">
          {count} {count === 1 ? "copo" : "copos"}
        </strong>{" "}
        · {formatLiters(drankMl)} de {formatLiters(goalMl)}
        {reached && <span style={{ color }}> · meta batida!</span>}
      </p>
    </div>
  );
}
