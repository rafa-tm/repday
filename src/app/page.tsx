import Link from "next/link";
import { and, asc, desc, eq, gte, sql } from "drizzle-orm";
import { Plus } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { TrackerCard } from "@/components/trackers/tracker-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/db";
import { doseLogs, trackers } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { requireProfile } from "@/lib/profile";
import { addDays, formatDayHeading, todayIn } from "@/lib/dates";
import { getTimeZone } from "@/lib/timezone";

// Janela do gráfico (53 semanas) + folga; a sequência também é calculada dentro dela.
const HISTORY_DAYS = 380;

export default async function Home() {
  const user = await requireUser();
  await requireProfile(user.id);
  const today = todayIn(await getTimeZone());

  const [items, logs] = await Promise.all([
    db
      .select()
      .from(trackers)
      .where(eq(trackers.userId, user.id))
      .orderBy(desc(sql`${trackers.kind} = 'water'`), asc(trackers.createdAt)),
    db
      .select({ trackerId: doseLogs.trackerId, date: doseLogs.date, doseIndex: doseLogs.doseIndex })
      .from(doseLogs)
      .where(and(eq(doseLogs.userId, user.id), gte(doseLogs.date, addDays(today, -HISTORY_DAYS)))),
  ]);

  const dosesByTracker = new Map<string, Map<string, number[]>>();
  for (const log of logs) {
    const byDay = dosesByTracker.get(log.trackerId) ?? new Map<string, number[]>();
    byDay.set(log.date, [...(byDay.get(log.date) ?? []), log.doseIndex]);
    dosesByTracker.set(log.trackerId, byDay);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 p-4 sm:p-6">
      <AppHeader email={user.email} />

      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Hoje</h1>
          <p className="text-sm text-muted-foreground">{formatDayHeading(today)}</p>
        </div>
        {items.length > 0 && (
          <Button asChild>
            <Link href="/items/new">
              <Plus data-icon="inline-start" />
              Novo item
            </Link>
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Nada para acompanhar ainda</CardTitle>
            <CardDescription>
              Crie um item para um remédio, vitamina ou hábito e marque as doses todos os dias.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/items/new">
                <Plus data-icon="inline-start" />
                Criar primeiro item
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {items.map((tracker) => (
            <TrackerCard
              key={tracker.id}
              tracker={tracker}
              today={today}
              dosesByDay={dosesByTracker.get(tracker.id) ?? new Map()}
            />
          ))}
        </div>
      )}
    </main>
  );
}
