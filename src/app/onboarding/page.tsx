import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { ProfileForm } from "@/components/profile/profile-form";
import { requireUser } from "@/lib/auth";
import { getProfile } from "@/lib/profile";

export default async function OnboardingPage() {
  const user = await requireUser();
  if (await getProfile(user.id)) redirect("/");

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col gap-6 p-4 sm:p-6">
      <AppHeader email={user.email} />
      <ProfileForm
        title="Conte um pouco sobre você"
        description="Usamos sua altura, peso e sexo para calcular quanta água você deve tomar por dia."
        submitLabel="Continuar"
      />
    </main>
  );
}
