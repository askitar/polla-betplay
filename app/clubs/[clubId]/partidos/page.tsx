import { redirect } from "next/navigation";
import { CalendarCheck, CalendarClock, CalendarDays } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getClubMatchesView, type MatchView } from "@/lib/matches-service";
import { getClubLeaderboard } from "@/lib/leaderboard-service";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { EmptyNote } from "@/components/ui/EmptyNote";
import { MatchCard } from "@/components/match/MatchCard";
import { PartidosSidebar } from "@/components/match/PartidosSidebar";
import { LiveRefresher } from "@/components/live/LiveRefresher";
import { GroupTables } from "@/components/playoffs/GroupTables";
import { getGroupTables, getPlayoffState } from "@/lib/playoff-service";
import { FINAL_FIRST_JORNADA, playoffStageLabel } from "@/lib/playoffs";

// Landing page of a club. Top: whatever plays TODAY across every fecha.
// Below it, in the same scroll: every remaining match, grouped by fecha, so
// nobody has to go hunting for "what comes next" or to predict ahead.
// /cronograma stays as the browse-by-fecha and filter view.
//
// Once the cuadrangulares exist this page shows only them (the league is
// over and still browsable in /cronograma and /clasificacion), each fecha
// split by group, then the final.
export default async function PartidosPage({
  params,
}: {
  params: Promise<{ clubId: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  const { clubId } = await params;
  const playoffs = await getPlayoffState(clubId, session.user.id);
  const torneo = playoffs.active ? "cuadrangulares" : "liga";
  const canPredict = !playoffs.active || playoffs.decision?.accepted === true;

  const [allMatches, membership, { entries: leaderboard, hasLiveMatch }, me] = await Promise.all([
    getClubMatchesView(clubId, session.user.id, new Date(), torneo),
    prisma.membership.findUnique({
      where: { userId_clubId: { userId: session.user.id, clubId } },
    }),
    getClubLeaderboard(clubId, torneo),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { favoriteTeam: { select: { name: true } } },
    }),
  ]);
  const isAdmin = membership?.role === "ADMIN";
  const favoriteTeamName = me?.favoriteTeam?.name ?? null;

  const byKickoff = (a: MatchView, b: MatchView) => a.kickoff.getTime() - b.kickoff.getTime();

  const today = allMatches.filter((m) => m.isToday && !m.postponed).sort(byKickoff);
  const todayIds = new Set(today.map((m) => m.id));

  const upcoming = allMatches
    .filter((m) => m.status === "SCHEDULED" && !m.postponed && !todayIds.has(m.id))
    .sort(byKickoff);
  const byFecha = new Map<number, MatchView[]>();
  for (const m of upcoming) {
    if (!byFecha.has(m.jornadaNumber)) byFecha.set(m.jornadaNumber, []);
    byFecha.get(m.jornadaNumber)!.push(m);
  }
  // Groups in the order they'll actually be played (a fecha with a brought
  // forward game can start before a lower-numbered one finishes).
  const fechaGroups = [...byFecha.entries()].sort(
    (a, b) => a[1][0].kickoff.getTime() - b[1][0].kickoff.getTime(),
  );

  const postponed = allMatches.filter((m) => m.postponed).sort((a, b) => a.jornadaNumber - b.jornadaNumber);

  const nextMatch = allMatches.find((m) => m.isNext);
  const topThree = leaderboard.filter((e) => e.rank <= 3).slice(0, 3);

  const groupTables = playoffs.active ? await getGroupTables() : [];
  const cardProps = { clubId, isAdmin, favoriteTeamName, showJornada: true as const, canPredict };
  const stage = (m: MatchView) => (playoffs.active ? playoffStageLabel(m.jornadaNumber, m.groupName) : null);
  const fechaTitle = (fecha: number) =>
    playoffs.active && fecha >= FINAL_FIRST_JORNADA ? (
      <span className="text-gold">{fecha === FINAL_FIRST_JORNADA ? "FINAL · IDA" : "FINAL · VUELTA"}</span>
    ) : (
      <>
        FECHA <span className="text-gold">{fecha}</span>
      </>
    );
  // Inside a cuadrangular fecha: Grupo A first, then Grupo B.
  const byGroup = (matches: MatchView[]) => {
    const groups = new Map<string, MatchView[]>();
    for (const m of matches) {
      const g = m.groupName ?? "";
      if (!groups.has(g)) groups.set(g, []);
      groups.get(g)!.push(m);
    }
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
  };

  return (
    <div className="lg:grid lg:grid-cols-[1fr_320px] lg:items-start lg:gap-8">
      <LiveRefresher active={hasLiveMatch} />
      <div>
        <SectionLabel count={today.length}>Hoy</SectionLabel>
        {today.length > 0 ? (
          today.map((m, i) => <MatchCard key={m.id} match={m} index={i} stageLabel={stage(m)} {...cardProps} />)
        ) : (
          <EmptyNote icon={CalendarCheck}>
            Hoy no hay partidos. Abajo están los que vienen, por si quieres adelantar predicciones.
          </EmptyNote>
        )}

        {fechaGroups.length > 0 && (
          <div className="mt-8">
            <SectionLabel count={upcoming.length} hint="puedes predecir desde ya">
              Lo que viene
            </SectionLabel>
            {fechaGroups.map(([fecha, matches]) => (
              <section key={fecha} className="mb-6" id={`fecha-${fecha}`}>
                <div className="mb-2.5 flex items-center gap-2.5 px-1">
                  <CalendarDays size={14} className="text-gold-dim" />
                  <span className="font-condensed text-xs tracking-[0.16em] text-ink-dim">
                    {fechaTitle(fecha)}
                  </span>
                  <span className="text-[11px] text-ink-faint">· {matches.length} partidos</span>
                </div>
                {playoffs.active
                  ? byGroup(matches).map(([group, ms]) => (
                      <div key={group}>
                        {group && (
                          <div className="mb-2 ml-1 font-display text-[15px] text-ink-dim">
                            Grupo <span className="text-gold">{group}</span>
                          </div>
                        )}
                        {ms.map((m, i) => (
                          <MatchCard key={m.id} match={m} index={i} stageLabel={stage(m)} {...cardProps} />
                        ))}
                      </div>
                    ))
                  : matches.map((m, i) => (
                      <MatchCard key={m.id} match={m} index={i} stageLabel={stage(m)} {...cardProps} />
                    ))}
              </section>
            ))}
          </div>
        )}

        {postponed.length > 0 && (
          <div className="mt-8">
            <SectionLabel count={postponed.length}>Aplazados, sin fecha nueva</SectionLabel>
            {postponed.map((m, i) => (
              <MatchCard key={m.id} match={m} index={i} stageLabel={stage(m)} {...cardProps} />
            ))}
          </div>
        )}

        {today.length === 0 && fechaGroups.length === 0 && postponed.length === 0 && (
          <div className="mt-6">
            <EmptyNote icon={CalendarClock}>No quedan partidos por jugar en la polla.</EmptyNote>
          </div>
        )}

        {groupTables.length > 0 && (
          <div className="mt-8 lg:hidden">
            <SectionLabel>Así van los grupos</SectionLabel>
            <GroupTables tables={groupTables} />
          </div>
        )}
      </div>

      <aside className="hidden lg:block">
        <PartidosSidebar clubId={clubId} nextMatch={nextMatch} topThree={topThree} />
        {groupTables.length > 0 && (
          <div className="mt-5">
            <GroupTables tables={groupTables} compact />
          </div>
        )}
      </aside>
    </div>
  );
}
