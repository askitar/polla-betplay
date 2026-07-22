import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Logo } from "@/components/ui/Logo";

function safeCallback(url: string | undefined): string {
  // Only ever redirect to a relative in-app path, never an external URL.
  if (url && url.startsWith("/") && !url.startsWith("//")) return url;
  return "/clubs";
}

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  const destination = safeCallback(callbackUrl);

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
      <Logo />
      <p className="mt-2 mb-8 text-[15px] leading-relaxed text-ink-dim">
        Antes de arrancar, ¿cómo te llamamos en la tabla de posiciones?
      </p>
      <form action={saveName} className="flex flex-col gap-3">
        <input
          type="text"
          name="name"
          required
          maxLength={30}
          placeholder="Tu nombre"
          className="input-field"
          autoFocus
        />
        <button type="submit" className="btn-primary w-full">
          Continuar
        </button>
      </form>
    </main>
  );
}
