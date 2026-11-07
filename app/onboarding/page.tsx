import { redirect } from "next/navigation";
import { UserRound } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Logo } from "@/components/ui/Logo";
import { GlassIcon } from "@/components/ui/GlassIcon";
import { safeRedirectTarget } from "@/lib/safe-redirect";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  const destination = safeRedirectTarget(callbackUrl, "/clubs");

  const session = await auth();
  if (!session?.user) redirect("/signin");
  if (session.user.name) redirect(destination);

  async function saveName(formData: FormData) {
    "use server";
    const session = await auth();
    if (!session?.user) redirect("/signin");
    const name = String(formData.get("name") || "").trim().slice(0, 30);
    if (!name) return;
    await prisma.user.update({ where: { id: session.user.id }, data: { name } });
    redirect(destination);
  }

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-5 py-10">
      <div className="mb-8 flex justify-center">
        <Logo />
      </div>
      <div className="card rise p-6">
        <div className="mb-4 flex items-center gap-3">
          <GlassIcon icon={UserRound} size="lg" />
          <div>
            <div className="font-display text-2xl leading-tight">¿Cómo te llamamos?</div>
            <div className="text-[13px] text-ink-dim">Así saldrás en la tabla de posiciones.</div>
          </div>
        </div>
        <form action={saveName} className="flex flex-col gap-3">
          <input
            type="text"
            name="name"
            required
            maxLength={30}
            placeholder="Tu nombre"
            className="input-field"
            autoFocus
            autoComplete="nickname"
          />
          <button type="submit" className="btn-primary w-full py-3">
            Continuar
          </button>
        </form>
      </div>
    </main>
  );
}
