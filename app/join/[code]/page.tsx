import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { findClubByCode } from "@/lib/club-service";
import { Logo } from "@/components/ui/Logo";

export default async function JoinByCodePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/signin?callbackUrl=/join/${code}`);

  const club = await findClubByCode(code);
  if (!club) notFound();

  const alreadyMember = await prisma.membership.findUnique({
    where: { userId_clubId: { userId: session.user.id, clubId: club.id } },
  });
  if (alreadyMember) redirect(`/clubs/${club.id}`);

  const userId = session.user.id;
  const clubId = club.id;

  async function confirmJoin() {
    "use server";
    await prisma.membership.create({ data: { userId, clubId, role: "MEMBER" } });
    redirect(`/clubs/${clubId}`);
  }

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-5 py-10 text-center">
      <Logo />
      <div className="card mt-8">
        <p className="text-[15px] leading-relaxed text-ink-dim">Te invitaron a unirte a</p>
        <p className="mt-1 font-display text-2xl text-gold">{club.name}</p>
        <p className="mt-1 text-xs text-ink-faint">{club._count.memberships} miembros</p>
        <form action={confirmJoin} className="mt-5">
          <button type="submit" className="btn-primary w-full">
            Unirme al club
          </button>
        </form>
      </div>
    </main>
  );
}
