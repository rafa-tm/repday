import { AppHeader } from "@/components/app-header";
import { TrackerForm } from "@/components/trackers/tracker-form";
import { requireUser } from "@/lib/auth";
import { createTracker } from "../actions";

export default async function NewItemPage() {
  const user = await requireUser();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-6 p-4 sm:p-6">
      <AppHeader email={user.email} />
      <TrackerForm action={createTracker} />
    </main>
  );
}
