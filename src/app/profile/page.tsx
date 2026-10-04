import { and, eq } from "drizzle-orm";
import { AppHeader } from "@/components/app-header";
import { ProfileForm } from "@/components/profile/profile-form";
import { db } from "@/db";
import { trackers } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { requireProfile } from "@/lib/profile";

export default async function ProfilePage() {
  const user = await requireUser();
  const profile = await requireProfile(user.id);
  const [water] = await db
    .select({ cupMl: trackers.doseAmount })
    .from(trackers)
    .where(and(eq(trackers.userId, user.id), eq(trackers.kind, "water")));

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col gap-6 p-4 sm:p-6">
      <AppHeader email={user.email} />
      <ProfileForm
        title="Perfil"
        description="Seus dados são usados para calcular a meta diária de água."
        submitLabel="Salvar"
        defaults={profile}
        waterCupMl={water?.cupMl ?? null}
        cancelable
      />
    </main>
  );
}
