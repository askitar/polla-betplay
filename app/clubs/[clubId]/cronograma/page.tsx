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
import { ViewSwitcher, CRONOGRAMA_VIEWS, type CronogramaView } from "@/components/match/ViewSwitcher";
import { TorneoSwitch, resolveTorneo } from "@/components/playoffs/TorneoSwitch";
import { getPlayoffState } from "@/lib/playoff-service";
import { FINAL_FIRST_JORNADA, playoffStageLabel } from "@/lib/playoffs";
import type { MatchView } from "@/lib/matches-service";

// Full calendar. "Por fecha" browses one fecha at a time, same as before;
// the other views (Jugados/Por jugar/Aplazados/En vivo) cut across the
// whole season by match status instead, for when what you want is "show me
// every postponed match" rather than "show me fecha 7". The "Hoy"
// cross-fecha view lives on /partidos. Every card still shows its own
// "FECHA N" so there's never ambiguity about which fecha you're looking at.
export default async function CronogramaPage({
  params,
  searchParams,
}: {
  params: Promise<{ clubId: string }>;
  searchParams: Promise<{ fecha?: string; view?: string; torneo?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  const { clubId } = await params;
  const { fecha, view: viewParam, torneo: torneoParam } = await searchParams;
  const playoffs = await getPlayoffState(clubId, session.user.id);
  const torneo = resolveTorneo(playoffs.active, torneoParam);
  const isPlayoffs = torneo === "cuadrangulares";
  const torneoQuery = playoffs.active && torneo === "liga" ? "torneo=liga" : "";
  const canPredict = !isPlayoffs || playoffs.decision?.accepted === true;
  const view: CronogramaView = CRONOGRAMA_VIEWS.some((v) => v.id === viewParam)
    ? (viewParam as CronogramaView)
    : "fecha";

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

  const jornadas = groupJornadas(allMatches);
  const currentJornada = fecha ? Number(fecha) : pickDefaultJornada(allMatches);

  const matches = allMatches.filter((m) => m.jornadaNumber === currentJornada);
  const upcoming = matches.filter((m) => m.status !== "FINISHED" && !m.postponed);
  const finishedInFecha = matches
    .filter((m) => m.status === "FINISHED")
    .sort((a, b) => b.kickoff.getTime() - a.kickoff.getTime());
  const postponedInFecha = matches.filter((m) => m.postponed);

  const allJugados = allMatches
    .filter((m) => m.status === "FINISHED")
    .sort((a, b) => b.kickoff.getTime() - a.kickoff.getTime());
  const allNoJugados = allMatches
    .filter((m) => m.status === "SCHEDULED")
    .sort((a, b) => a.kickoff.getTime() - b.kickoff.getTime());
  const allAplazados = allMatches
    .filter((m) => m.postponed)
    .sort((a, b) => a.jornadaNumber - b.jornadaNumber);
  const allEnVivo = allMatches
    .filter((m) => m.status === "LIVE")
    .sort((a, b) => a.kickoff.getTime() - b.kickoff.getTime());

  const nextMatch = allMatches.find((m) => m.isNext);
  const topThree = leaderboard.slice(0, 3);

  const cardProps = { clubId, isAdmin, favoriteTeamName, showJornada: true as const, canPredict };
  const stage = (m: MatchView) => (isPlayoffs ? playoffStageLabel(m.jornadaNumber, m.groupName) : null);
  const byGroupThenKickoff = (a: MatchView, b: MatchView) =>
    (a.groupName ?? "").localeCompare(b.groupName ?? "") || a.kickoff.getTime() - b.kickoff.getTime();
  if (isPlayoffs) upcoming.sort(byGroupThenKickoff);
  const currentLabel =
    isPlayoffs && currentJornada >= FINAL_FIRST_JORNADA
      ? currentJornada === FINAL_FIRST_JORNADA
        ? "Final ida"
        : "Final vuelta"
      : null;

  return (
    <div className="lg:grid lg:grid-cols-[1fr_320px] lg:items-start lg:gap-8">
      <LiveRefresher active={hasLiveMatch} />
      <div>
        {playoffs.active && <TorneoSwitch basePath={`/clubs/${clubId}/cronograma`} current={torneo} />}
        <ViewSwitcher clubId={clubId} current={view} torneoQuery={torneoQuery} />

        {view === "fecha" && (
          <>
            <JornadaSwitcher
              clubId={clubId}
              jornadas={jornadas}
              current={currentJornada}
              extraQuery={torneoQuery ? `&${torneoQuery}` : ""}
              currentLabel={currentLabel}
            />

            {upcoming.length > 0 && (
              <>
                <SectionLabel>Por jugar</SectionLabel>
                {upcoming.map((m) => (
                  <MatchCard key={m.id} match={m} stageLabel={stage(m)} {...cardProps} />
                ))}
              </>
            )}

            {finishedInFecha.length > 0 && (
              <>
                <SectionLabel className="mt-2">Finalizados</SectionLabel>
                {finishedInFecha.map((m) => (
                  <MatchCard key={m.id} match={m} stageLabel={stage(m)} {...cardProps} />
                ))}
              </>
            )}

            {postponedInFecha.length > 0 && (
              <>
                <SectionLabel className="mt-2">Aplazados</SectionLabel>
                {postponedInFecha.map((m) => (
                  <MatchCard key={m.id} match={m} stageLabel={stage(m)} {...cardProps} />
                ))}
              </>
            )}

            {matches.length === 0 && <EmptyNote>No hay partidos programados en esta fecha.</EmptyNote>}
          </>
        )}

        {view === "jugados" && (
          <>
            <SectionLabel>Jugados</SectionLabel>
            {allJugados.length > 0 ? (
              allJugados.map((m) => <MatchCard key={m.id} match={m} stageLabel={stage(m)} {...cardProps} />)
            ) : (
              <EmptyNote>Todavía no se ha jugado ningún partido.</EmptyNote>
            )}
          </>
        )}

        {view === "no-jugados" && (
          <>
            <SectionLabel>Por jugar</SectionLabel>
            {allNoJugados.length > 0 ? (
              allNoJugados.map((m) => <MatchCard key={m.id} match={m} stageLabel={stage(m)} {...cardProps} />)
            ) : (
              <EmptyNote>No hay partidos programados por jugar.</EmptyNote>
            )}
          </>
        )}

        {view === "aplazados" && (
          <>
            <SectionLabel>Aplazados</SectionLabel>
            {allAplazados.length > 0 ? (
              allAplazados.map((m) => <MatchCard key={m.id} match={m} stageLabel={stage(m)} {...cardProps} />)
            ) : (
              <EmptyNote>No hay partidos aplazados en este momento.</EmptyNote>
            )}
          </>
        )}

        {view === "en-vivo" && (
          <>
            <SectionLabel>En vivo</SectionLabel>
            {allEnVivo.length > 0 ? (
              allEnVivo.map((m) => <MatchCard key={m.id} match={m} stageLabel={stage(m)} {...cardProps} />)
            ) : (
              <EmptyNote>No hay ningún partido en vivo en este momento.</EmptyNote>
            )}
          </>
        )}
      </div>

      <aside className="hidden lg:flex lg:flex-col lg:gap-6">
        <PartidosSidebar clubId={clubId} nextMatch={nextMatch} topThree={topThree} />
      </aside>
    </div>
  );
}
