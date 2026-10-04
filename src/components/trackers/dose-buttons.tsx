"use client";

import { useOptimistic, useTransition } from "react";
import { Check } from "lucide-react";
import { toggleDose } from "@/app/items/actions";
import { Button } from "@/components/ui/button";
import { readableTextColor } from "@/lib/trackers";

export function DoseButtons({
  trackerId,
  day,
  times,
  taken,
  color,
}: {
  trackerId: string;
  day: string;
  times: string[];
  taken: number[];
  color: string;
}) {
  const [, startTransition] = useTransition();
  const [optimisticTaken, toggleOptimistic] = useOptimistic(taken, (state, index: number) =>
    state.includes(index) ? state.filter((i) => i !== index) : [...state, index],
  );

  return (
    <div className="flex flex-wrap gap-2">
      {times.map((time, index) => {
        const isTaken = optimisticTaken.includes(index);
        return (
          <Button
            key={index}
            type="button"
            variant={isTaken ? "default" : "outline"}
            aria-pressed={isTaken}
            aria-label={`Dose das ${time}${isTaken ? " (tomada)" : ""}`}
            onClick={() =>
              startTransition(async () => {
                toggleOptimistic(index);
                await toggleDose(trackerId, day, index);
              })
            }
            className="tabular-nums"
            style={isTaken ? { backgroundColor: color, color: readableTextColor(color) } : undefined}
          >
            {isTaken && <Check data-icon="inline-start" />}
            {time}
          </Button>
        );
      })}
    </div>
  );
}
