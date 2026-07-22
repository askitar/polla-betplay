import { redirect } from "next/navigation";
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
  if (!club) {
    return (
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-5 py-10 text-center">
        <Logo />
        <div className="card mt-8">
          <p className="text-[15px] leading-relaxed text-ink-dim">
            No encontramos ningún club con el código <span className="text-ink">{code}</span>.
            Pídele a quien te invitó que te pase el link de nuevo.
          </p>
        </div>
      </main>
    );
  }

  // Zero-friction join: being logged in and clicking the link is enough,
  // no separate confirmation step.
  const alreadyMember = await prisma.membership.findUnique({
    where: { userId_clubId: { userId: session.user.id, clubId: club.id } },
  });
  if (!alreadyMember) {
    await prisma.membership.create({
      data: { userId: session.user.id, clubId: club.id, role: "MEMBER" },
    });
  }

  redirect(`/clubs/${club.id}`);
}
