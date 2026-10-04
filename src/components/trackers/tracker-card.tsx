import { Bell, Droplet, Flame } from "lucide-react";
import type { Tracker } from "@/db/schema";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatLiters, waterGoalMl } from "@/lib/water";
import { adherence, currentStreak, describeSchedule, formatDose, isScheduledOn } from "@/lib/trackers";
import { ContributionGraph } from "./contribution-graph";
import { DoseButtons } from "./dose-buttons";
import { TrackerMenu } from "./tracker-menu";
import { WaterCups } from "./water-cups";

export function TrackerCard({
  tracker,
  today,
  dosesByDay,
}: {
  tracker: Tracker;
  today: string;
  /** Índices das doses tomadas em cada dia. */
  dosesByDay: Map<string, number[]>;
}) {
  const takenByDay = new Map([...dosesByDay].map(([day, doses]) => [day, doses.length]));
  const takenOn = (day: string) => takenByDay.get(day) ?? 0;
  const scheduledToday = isScheduledOn(tracker, today);
  const streak = currentStreak(tracker, today, takenOn);
  const rate = adherence(tracker, today, takenOn);
  const isWater = tracker.kind === "water";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isWater ? (
            <Droplet className="size-4 shrink-0" style={{ color: tracker.color }} fill={tracker.color} />
          ) : (
            <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: tracker.color }} />
          )}
          <span className="truncate">{tracker.name}</span>
          {tracker.remindersEnabled && (
            <Bell className="size-3.5 shrink-0 text-muted-foreground" aria-label="Lembretes ativados" />
          )}
        </CardTitle>
        <CardDescription>
          {isWater ? (
            <>
              Meta mínima de {formatLiters(waterGoalMl(tracker))}/dia · copo de {tracker.doseAmount} ml
            </>
          ) : (
            <>
              {formatDose(tracker.doseAmount, tracker.doseUnit)} · {tracker.dosesPerDay}x ao dia ·{" "}
              {describeSchedule(tracker)}
            </>
          )}
        </CardDescription>
        <CardAction>
          <TrackerMenu id={tracker.id} name={tracker.name} />
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-muted-foreground uppercase">Hoje</span>
          {isWater ? (
            <WaterCups
              trackerId={tracker.id}
              day={today}
              taken={takenOn(today)}
              goalCups={tracker.dosesPerDay}
              cupMl={tracker.doseAmount}
              goalMl={waterGoalMl(tracker)}
              color={tracker.color}
            />
          ) : scheduledToday ? (
            <DoseButtons
              trackerId={tracker.id}
              day={today}
              times={tracker.doseTimes}
              taken={dosesByDay.get(today) ?? []}
              color={tracker.color}
            />
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma dose programada para hoje.</p>
          )}
        </div>

        <ContributionGraph
          tracker={tracker}
          today={today}
          takenByDay={takenByDay}
          unit={isWater ? ["copo", "copos"] : ["dose", "doses"]}
        />
      </CardContent>

      <CardFooter className="mt-4 gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Flame className="size-4" />
          Sequência: <strong className="font-medium text-foreground tabular-nums">{streak}</strong>{" "}
          {streak === 1 ? "dia" : "dias"}
        </span>
        <span>
          Adesão (30 dias):{" "}
          <strong className="font-medium text-foreground tabular-nums">{rate === null ? "—" : `${rate}%`}</strong>
        </span>
      </CardFooter>
    </Card>
  );
}
