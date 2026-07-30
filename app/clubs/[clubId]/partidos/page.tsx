import Link from "next/link";
import { redirect } from "next/navigation";
import { Trophy } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getClubMatchesView, groupJornadas, pickDefaultJornada } from "@/lib/matches-service";
import { getClubLeaderboard } from "@/lib/leaderboard-service";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { EmptyNote } from "@/components/ui/EmptyNote";
import { MatchCard } from "@/components/match/MatchCard";
import { JornadaSwitcher } from "@/components/match/JornadaSwitcher";
import { CountdownTimer } from "@/components/match/CountdownTimer";
import { LiveRefresher } from "@/components/live/LiveRefresher";

export default async function PartidosPage({
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

  const today = upcoming.filter((m) => m.isToday);
  const later = upcoming.filter((m) => !m.isToday);

  const nextMatch = allMatches.find((m) => m.isNext);
  const topThree = leaderboard.slice(0, 3);

  return (
    <div className="lg:grid lg:grid-cols-[1fr_320px] lg:items-start lg:gap-8">
      <LiveRefresher active={hasLiveMatch} />
      <div>
        <JornadaSwitcher clubId={clubId} jornadas={jornadas} current={currentJornada} />

        {today.length > 0 && (
          <>
            <SectionLabel>Hoy</SectionLabel>
            {today.map((m) => (
              <MatchCard key={m.id} clubId={clubId} match={m} isAdmin={isAdmin} favoriteTeamName={favoriteTeamName} />
            ))}
          </>
        )}

        {later.length > 0 && (
          <>
            <SectionLabel className={today.length > 0 ? "mt-2" : ""}>
              Por jugar
            </SectionLabel>
            {later.map((m) => (
              <MatchCard key={m.id} clubId={clubId} match={m} isAdmin={isAdmin} favoriteTeamName={favoriteTeamName} />
            ))}
          </>
        )}

        {finished.length > 0 && (
          <>
            <SectionLabel className="mt-2">Finalizados</SectionLabel>
            {finished.map((m) => (
              <MatchCard key={m.id} clubId={clubId} match={m} isAdmin={isAdmin} favoriteTeamName={favoriteTeamName} />
            ))}
          </>
        )}

        {postponed.length > 0 && (
          <>
            <SectionLabel className="mt-2">Aplazados</SectionLabel>
            {postponed.map((m) => (
              <MatchCard key={m.id} clubId={clubId} match={m} isAdmin={isAdmin} favoriteTeamName={favoriteTeamName} />
            ))}
          </>
        )}

        {matches.length === 0 && <EmptyNote>No hay partidos programados en esta fecha.</EmptyNote>}
      </div>

      <aside className="hidden lg:flex lg:flex-col lg:gap-6">
        {nextMatch && (
          <div className="sticky top-6">
            <SectionLabel>Próximo partido</SectionLabel>
            <div className="ticket-card relative border-gold p-4 shadow-[0_0_0_1px_rgba(255,199,44,0.25),0_4px_18px_rgba(255,199,44,0.08)]">
              {!nextMatch.started && (
                <div className="absolute -top-2.5 right-4">
                  <CountdownTimer kickoff={nextMatch.kickoff.toISOString()} />
                </div>
              )}
              <div className="text-center text-xs text-ink-dim">
                {new Date(nextMatch.kickoff).toLocaleDateString("es-CO", {
                  weekday: "long",
                  day: "2-digit",
                  month: "short",
                })}{" "}
                ·{" "}
                {new Date(nextMatch.kickoff).toLocaleTimeString("es-CO", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
              <div className="mt-2 flex items-center justify-center gap-3 font-display text-lg">
                <span>{nextMatch.homeTeam.name}</span>
                <span className="text-ink-faint">vs</span>
                <span>{nextMatch.awayTeam.name}</span>
              </div>
            </div>

            <SectionLabel className="mt-7">Top del club</SectionLabel>
            <div className="card">
              {topThree.map((entry, i) => (
                <div
                  key={entry.userId}
                  className={`flex items-center gap-2.5 py-2 ${
                    i < topThree.length - 1 ? "border-b border-line" : ""
                  }`}
                >
                  <span
                    className={`font-display text-sm ${i === 0 ? "text-gold" : "text-ink-faint"}`}
                  >
                    {i + 1}
                  </span>
                  <span className="flex-1 text-sm">{entry.userName}</span>
                  <span className="font-display text-lg text-gold">{entry.points}</span>
                </div>
              ))}
              {topThree.length === 0 && (
                <p className="py-2 text-xs text-ink-faint">Aún sin puntos.</p>
              )}
              <Link
                href={`/clubs/${clubId}/clasificacion`}
                className="mt-3 flex items-center gap-1.5 text-xs text-ink-dim hover:text-gold"
              >
                <Trophy size={13} /> Ver tabla completa
              </Link>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
