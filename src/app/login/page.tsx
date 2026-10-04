import { LogoMark } from "@/components/logo";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-6 p-6">
      <div className="flex flex-col items-center gap-2">
        <LogoMark className="size-14" />
        <h1 className="text-2xl font-semibold tracking-tight">RepDay</h1>
        <p className="text-sm text-muted-foreground">Seus cuidados de todo dia, em dia.</p>
      </div>
      <LoginForm linkError={Boolean(error)} />
    </main>
  );
}
