import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getClubMatchesView } from "@/lib/matches-service";
import { getClubLeaderboard } from "@/lib/leaderboard-service";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { EmptyNote } from "@/components/ui/EmptyNote";
import { MatchCard } from "@/components/match/MatchCard";
import { PartidosSidebar } from "@/components/match/PartidosSidebar";
import { LiveRefresher } from "@/components/live/LiveRefresher";

// Landing page: whatever is playing TODAY, across every fecha — a
// rescheduled match can land on any fecha's calendar, so this is no longer
// scoped to a single "current" fecha (see /cronograma for that). Each card
// still carries its own fecha so nobody has to guess which one it belongs
// to.
export default async function PartidosPage({
  params,
}: {
  params: Promise<{ clubId: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  const { clubId } = await params;

  const [allMatches, membership, { entries: leaderboard, hasLiveMatch }, me] = await Promise.all([
    getClubMatchesView(clubId, session.user.id),
    prisma.membership.findUnique({
      where: { userId_clubId: { userId: session.user.id, clubId } },
    }),
    getClubLeaderboard(clubId),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { favoriteTeam: { select: { name: true } } },
    }),
  ]);
  const isAdmin = membership?.role === "ADMIN";
  const favoriteTeamName = me?.favoriteTeam?.name ?? null;

  const today = allMatches
    .filter((m) => m.isToday && !m.postponed)
    .sort((a, b) => a.kickoff.getTime() - b.kickoff.getTime());

  const nextMatch = allMatches.find((m) => m.isNext);
  const topThree = leaderboard.slice(0, 3);

  return (
    <div className="lg:grid lg:grid-cols-[1fr_320px] lg:items-start lg:gap-8">
      <LiveRefresher active={hasLiveMatch} />
      <div>
        <SectionLabel>Hoy</SectionLabel>
        {today.length > 0 ? (
          today.map((m) => (
            <MatchCard
              key={m.id}
              clubId={clubId}
              match={m}
              isAdmin={isAdmin}
              favoriteTeamName={favoriteTeamName}
              showJornada
            />
          ))
        ) : (
          <EmptyNote>No hay partidos programados para hoy.</EmptyNote>
        )}
      </div>

      <aside className="hidden lg:flex lg:flex-col lg:gap-6">
        <PartidosSidebar clubId={clubId} nextMatch={nextMatch} topThree={topThree} />
      </aside>
    </div>
  );
}
