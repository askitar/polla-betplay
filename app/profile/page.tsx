import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { safeRedirectTarget } from "@/lib/safe-redirect";
import { Logo } from "@/components/ui/Logo";
import { ProfileForm } from "@/components/profile/ProfileForm";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  const { from } = await searchParams;
  const backHref = safeRedirectTarget(from, "/clubs");

  const [user, teams] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { favoriteTeamId: true },
    }),
    prisma.team.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <main className="mx-auto w-full max-w-sm flex-1 px-5 py-10">
      <Link href={backHref} className="icon-btn mb-5 inline-flex" aria-label="Volver">
        <ArrowLeft size={16} />
      </Link>
      <Logo />
      <p className="mt-2 mb-8 text-[15px] leading-relaxed text-ink-dim">Tu perfil</p>
      <ProfileForm
        name={session.user.name ?? ""}
        email={session.user.email ?? ""}
        image={session.user.image ?? null}
        teams={teams}
        favoriteTeamId={user?.favoriteTeamId ?? null}
      />
    </main>
  );
}
