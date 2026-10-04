import type { Tracker } from "@/db/schema";
import { addDays, dayOfWeek, formatDayLong, formatMonthShort } from "@/lib/dates";
import { dayStatus, type DayStatus } from "@/lib/trackers";
import { cn } from "@/lib/utils";

const WEEKS = 53;
const CELL = 11;
const GAP = 3;
const WEEKDAY_LABELS = ["", "Seg", "", "Qua", "", "Sex", ""];

/** Intensidade da cor (0–100) conforme a fração de doses tomadas, como os 4 tons do GitHub. */
function intensity(taken: number, total: number) {
  if (taken === 0) return 0;
  if (taken >= total) return 100;
  const ratio = taken / total;
  return ratio <= 1 / 3 ? 35 : ratio <= 2 / 3 ? 55 : 75;
}

function cellStyle(status: DayStatus, color: string): React.CSSProperties | undefined {
  if (status.kind !== "scheduled") return undefined;
  const pct = intensity(status.taken, status.total);
  if (pct === 0) return undefined;
  return { backgroundColor: `color-mix(in oklch, ${color} ${pct}%, var(--muted))` };
}

function cellLabel(day: string, status: DayStatus, [singular, plural]: [string, string]) {
  const date = formatDayLong(day);
  switch (status.kind) {
    case "scheduled":
      return `${date}: ${status.taken} de ${status.total} ${status.total === 1 ? singular : plural}`;
    case "off":
      return `${date}: sem dose programada`;
    case "inactive":
      return `${date}: antes de começar o acompanhamento`;
    case "future":
      return date;
  }
}

export function ContributionGraph({
  tracker,
  today,
  takenByDay,
  unit,
}: {
  tracker: Tracker;
  today: string;
  takenByDay: Map<string, number>;
  /** Rótulo singular/plural usado no tooltip de cada dia. */
  unit: [string, string];
}) {
  // Começa num domingo, 52 semanas atrás, e termina no sábado desta semana (igual ao GitHub).
  const start = addDays(today, -(WEEKS - 1) * 7 - dayOfWeek(today));
  const takenOn = (day: string) => takenByDay.get(day) ?? 0;

  const weeks = Array.from({ length: WEEKS }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const day = addDays(start, w * 7 + d);
      return { day, status: dayStatus(tracker, day, today, takenOn) };
    }),
  );

  // Rótulo do mês na coluna em que o mês começa (pulando a primeira se o mês já estiver no meio).
  const months = weeks.flatMap((week, w) => {
    const first = week.find((c) => c.day.endsWith("-01"));
    if (w === 0 && !first) return [{ col: 0, label: formatMonthShort(week[0].day) }];
    return first ? [{ col: w, label: formatMonthShort(first.day) }] : [];
  });
  // Evita sobrepor o rótulo inicial com o do mês seguinte e cortar o último na borda direita.
  if (months.length > 1 && months[1].col - months[0].col < 3) months.shift();
  if (months.at(-1)!.col > WEEKS - 3) months.pop();

  const grid = {
    gridTemplateColumns: `repeat(${WEEKS}, ${CELL}px)`,
    gap: GAP,
  } satisfies React.CSSProperties;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1" role="img" aria-label={`Histórico de ${tracker.name}`}>
        {/* Rótulos dos dias ficam fora da rolagem para continuarem visíveis. */}
        <div
          className="grid shrink-0 pt-[18px] text-[10px] leading-none text-muted-foreground"
          style={{ gridTemplateRows: `repeat(7, ${CELL}px)`, gap: GAP }}
        >
          {WEEKDAY_LABELS.map((label, i) => (
            <span key={i} className="flex items-center pr-1">
              {label}
            </span>
          ))}
        </div>

        {/* direction: rtl faz a rolagem horizontal começar no fim (semana atual) em telas pequenas. */}
        <div className="min-w-0 overflow-x-auto pb-1 [direction:rtl]">
          <div className="inline-flex flex-col gap-[7px] [direction:ltr]">
            <div className="grid h-[11px] text-[10px] leading-none text-muted-foreground" style={grid}>
              {months.map((m) => (
                <span key={m.col} className="whitespace-nowrap" style={{ gridColumnStart: m.col + 1 }}>
                  {m.label}
                </span>
              ))}
            </div>

            <div className="grid grid-flow-col" style={{ ...grid, gridTemplateRows: `repeat(7, ${CELL}px)` }}>
              {weeks.flat().map(({ day, status }) => (
                <div
                  key={day}
                  title={cellLabel(day, status, unit)}
                  className={cn(
                    "rounded-[2px]",
                    status.kind === "future" && "invisible",
                    status.kind === "scheduled" && "bg-muted",
                    (status.kind === "off" || status.kind === "inactive") && "bg-muted/40",
                    day === today && "outline outline-1 outline-offset-1 outline-foreground/50",
                  )}
                  style={cellStyle(status, tracker.color)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
        <span className="mr-1">Menos</span>
        {[0, 35, 55, 75, 100].map((pct) => (
          <span
            key={pct}
            className="size-[11px] rounded-[2px] bg-muted"
            style={pct ? { backgroundColor: `color-mix(in oklch, ${tracker.color} ${pct}%, var(--muted))` } : undefined}
          />
        ))}
        <span className="ml-1">Mais</span>
      </div>
    </div>
  );
}
