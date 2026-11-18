import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ClubHeader } from "@/components/club/ClubHeader";
import { ClubTabs } from "@/components/club/ClubTabs";
import { PollaProgressCard } from "@/components/club/PollaProgressCard";
import { PlayoffInviteCard } from "@/components/playoffs/PlayoffInviteCard";
import { PlayoffProgressCard } from "@/components/playoffs/PlayoffProgressCard";
import { getTournamentMatches } from "@/lib/club-data";
import { getPlayoffProgress, getPlayoffState } from "@/lib/playoff-service";
import { computePollaProgress } from "@/lib/season";

export default async function ClubLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ clubId: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  const { clubId } = await params;
  const membership = await prisma.membership.findUnique({
    where: { userId_clubId: { userId: session.user.id, clubId } },
    include: { club: true },
  });
  if (!membership) notFound();

  // Same per-request cached reads the pages use, so these add no extra query.
  const playoffs = await getPlayoffState(clubId, session.user.id);

  let banner: React.ReactNode;
  if (playoffs.active) {
    if (playoffs.decision?.accepted) {
      banner = (
        <PlayoffProgressCard
          clubId={clubId}
          progress={await getPlayoffProgress()}
          participants={playoffs.participants}
          joined
        />
      );
    } else {
      banner = (
        <PlayoffInviteCard
          clubId={clubId}
          mode={playoffs.decision ? "declined" : "undecided"}
          participants={playoffs.participants}
        />
      );
    }
  } else {
    const matches = await getTournamentMatches("liga");
    const progress = computePollaProgress(
      matches.map((m) => ({ jornadaNumber: m.jornada.number, status: m.status, kickoff: m.kickoff })),
    );
    banner = <PollaProgressCard clubId={clubId} progress={progress} />;
  }

  // Once the cuadrangulares exist the whole club turns red, for everyone.
  return (
    <div className={`flex flex-1 flex-col ${playoffs.active ? "theme-red" : ""}`}>
      {playoffs.active && (
        <div className="bg-aurora bg-aurora-red" aria-hidden>
          <div className="grid" />
        </div>
      )}
      <ClubHeader
        clubId={clubId}
        clubName={membership.club.name}
        userName={session.user.name ?? ""}
        userImage={session.user.image}
      />
      <ClubTabs clubId={clubId} />
      <div className="mx-auto w-full max-w-3xl flex-1 px-5 pt-6 pb-28 lg:max-w-5xl lg:pb-6">
        {banner}
        {children}
      </div>
    </div>
  );
}
