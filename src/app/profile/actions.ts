"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { saveProfile } from "@/lib/profile";
import { parseBodyForm } from "@/lib/water";

export type ProfileFormState = { error?: string } | undefined;

export async function saveProfileAction(_prev: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const user = await requireUser();
  const parsed = parseBodyForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await saveProfile(user.id, parsed.data);
  revalidatePath("/");
  redirect("/");
}
