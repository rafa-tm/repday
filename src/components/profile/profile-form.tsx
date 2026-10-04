"use client";

import Link from "next/link";
import { useActionState } from "react";
import { CircleAlert } from "lucide-react";
import { saveProfileAction } from "@/app/profile/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { BodyFields, type BodyDefaults } from "./body-fields";

export function ProfileForm({
  title,
  description,
  submitLabel,
  defaults,
  waterCupMl,
  cancelable,
}: {
  title: string;
  description: string;
  submitLabel: string;
  defaults?: BodyDefaults;
  waterCupMl?: number | null;
  cancelable?: boolean;
}) {
  const [state, action, pending] = useActionState(saveProfileAction, undefined);

  return (
    <form action={action}>
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <BodyFields defaults={defaults} waterCupMl={waterCupMl} />
          {state?.error && (
            <Alert variant="destructive">
              <CircleAlert />
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="mt-6 flex justify-end gap-2">
          {cancelable && (
            <Button variant="ghost" asChild>
              <Link href="/">Cancelar</Link>
            </Button>
          )}
          <Button type="submit" disabled={pending}>
            {pending ? "Salvando..." : submitLabel}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
