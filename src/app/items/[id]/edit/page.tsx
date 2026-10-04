import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { TrackerForm } from "@/components/trackers/tracker-form";
import { WaterForm } from "@/components/trackers/water-form";
import { db } from "@/db";
import { trackers } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { getProfile } from "@/lib/profile";
import { recommendedWaterMl } from "@/lib/water";
import { updateTracker, updateWaterTracker } from "../../actions";

export default async function EditItemPage({ params }: PageProps<"/items/[id]/edit">) {
  const { id } = await params;
  const user = await requireUser();

  const isUuid = /^[0-9a-f-]{36}$/i.test(id);
  const [tracker] = isUuid
    ? await db.select().from(trackers).where(and(eq(trackers.id, id), eq(trackers.userId, user.id)))
    : [];
  if (!tracker) notFound();
  const profile = tracker.kind === "water" ? await getProfile(user.id) : undefined;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-6 p-4 sm:p-6">
      <AppHeader email={user.email} />
      {tracker.kind === "water" ? (
        <WaterForm
          action={updateWaterTracker.bind(null, tracker.id)}
          tracker={tracker}
          recommendedMl={profile ? recommendedWaterMl(profile) : undefined}
        />
      ) : (
        <TrackerForm action={updateTracker.bind(null, tracker.id)} tracker={tracker} />
      )}
    </main>
  );
}
