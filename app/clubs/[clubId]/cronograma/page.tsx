import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getClubMatchesView, groupJornadas, pickDefaultJornada } from "@/lib/matches-service";
import { getClubLeaderboard } from "@/lib/leaderboard-service";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { EmptyNote } from "@/components/ui/EmptyNote";
import { MatchCard } from "@/components/match/MatchCard";
import { JornadaSwitcher } from "@/components/match/JornadaSwitcher";
import { PartidosSidebar } from "@/components/match/PartidosSidebar";
import { LiveRefresher } from "@/components/live/LiveRefresher";

// Full calendar, browsed one fecha at a time — the "Hoy" cross-fecha view
// lives on /partidos instead. Every card still shows its own "FECHA N" so
// there's never ambiguity about which fecha you're looking at.
export default async function CronogramaPage({
  params,
  searchParams,
}: {
  params: Promise<{ clubId: string }>;
  searchParams: Promise<{ fecha?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  const { clubId } = await params;
  const { fecha } = await searchParams;

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

  const jornadas = groupJornadas(allMatches);
  const currentJornada = fecha ? Number(fecha) : pickDefaultJornada(allMatches);

  const matches = allMatches.filter((m) => m.jornadaNumber === currentJornada);
  const upcoming = matches.filter((m) => m.status !== "FINISHED" && !m.postponed);
  const finished = matches
    .filter((m) => m.status === "FINISHED")
    .sort((a, b) => b.kickoff.getTime() - a.kickoff.getTime());
  const postponed = matches.filter((m) => m.postponed);

  const nextMatch = allMatches.find((m) => m.isNext);
  const topThree = leaderboard.slice(0, 3);

  return (
    <div className="lg:grid lg:grid-cols-[1fr_320px] lg:items-start lg:gap-8">
      <LiveRefresher active={hasLiveMatch} />
      <div>
        <JornadaSwitcher clubId={clubId} jornadas={jornadas} current={currentJornada} />

        {upcoming.length > 0 && (
          <>
            <SectionLabel>Por jugar</SectionLabel>
            {upcoming.map((m) => (
              <MatchCard
                key={m.id}
                clubId={clubId}
                match={m}
                isAdmin={isAdmin}
                favoriteTeamName={favoriteTeamName}
                showJornada
              />
            ))}
          </>
        )}

        {finished.length > 0 && (
          <>
            <SectionLabel className="mt-2">Finalizados</SectionLabel>
            {finished.map((m) => (
              <MatchCard
                key={m.id}
                clubId={clubId}
                match={m}
                isAdmin={isAdmin}
                favoriteTeamName={favoriteTeamName}
                showJornada
              />
            ))}
          </>
        )}

        {postponed.length > 0 && (
          <>
            <SectionLabel className="mt-2">Aplazados</SectionLabel>
            {postponed.map((m) => (
              <MatchCard
                key={m.id}
                clubId={clubId}
                match={m}
                isAdmin={isAdmin}
                favoriteTeamName={favoriteTeamName}
                showJornada
              />
            ))}
          </>
        )}

        {matches.length === 0 && <EmptyNote>No hay partidos programados en esta fecha.</EmptyNote>}
      </div>

      <aside className="hidden lg:flex lg:flex-col lg:gap-6">
        <PartidosSidebar clubId={clubId} nextMatch={nextMatch} topThree={topThree} />
      </aside>
    </div>
  );
}
