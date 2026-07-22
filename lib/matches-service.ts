import { prisma } from "@/lib/prisma";
import { isLocked, isStarted, isWithinWarningWindow } from "@/lib/match-time";

export type MatchView = {
  id: string;
  kickoff: Date;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  homeTeam: { id: string; name: string };
  awayTeam: { id: string; name: string };
  jornadaNumber: number;
  jornadaLabel: string | null;
  locked: boolean;
  started: boolean;
  isNext: boolean;
  myPrediction: { homeScore: number; awayScore: number } | null;
  selfMissingWarning: boolean;
  membersReveal: Array<{
    userId: string;
    userName: string;
    prediction: { homeScore: number; awayScore: number } | null;
  }> | null;
  missingMemberNames: string[] | null;
};

export async function getClubMatchesView(clubId: string, userId: string, now: Date = new Date()) {
  const [matches, memberships, myPredictions] = await Promise.all([
    prisma.match.findMany({
      include: { homeTeam: true, awayTeam: true, jornada: true },
      orderBy: { kickoff: "asc" },
    }),
    prisma.membership.findMany({
      where: { clubId },
      include: { user: { select: { id: true, name: true } } },
    }),
    prisma.prediction.findMany({ where: { userId } }),
  ]);

  const myPredictionMap = new Map(myPredictions.map((p) => [p.matchId, p]));
  const memberIds = memberships.map((m) => m.userId);

  const notFinished = matches.filter((m) => m.status !== "FINISHED");
  const futureKickoffs = notFinished
    .map((m) => m.kickoff.getTime())
    .filter((t) => t > now.getTime());
  const nextKickoffMs = futureKickoffs.length ? Math.min(...futureKickoffs) : null;

  // Matches where we need to know OTHER members' predictions: either already
  // started (full reveal) or inside the 2h warning window (existence only,
  // never the actual scores — that stays hidden server-side until kickoff).
  const relevantMatchIds = matches
    .filter((m) => isStarted(m.kickoff, now) || isWithinWarningWindow(m.kickoff, now))
    .map((m) => m.id);

  const relevantPredictions = relevantMatchIds.length
    ? await prisma.prediction.findMany({
        where: { matchId: { in: relevantMatchIds }, userId: { in: memberIds } },
      })
    : [];

  const predictionIndex = new Map<string, Map<string, { homeScore: number; awayScore: number }>>();
  for (const p of relevantPredictions) {
    if (!predictionIndex.has(p.matchId)) predictionIndex.set(p.matchId, new Map());
    predictionIndex.get(p.matchId)!.set(p.userId, { homeScore: p.homeScore, awayScore: p.awayScore });
  }

  const views: MatchView[] = matches.map((m) => {
    const started = m.status === "FINISHED" || isStarted(m.kickoff, now);
    const locked = m.status === "FINISHED" || isLocked(m.kickoff, now);
    const withinWarning = !started && isWithinWarningWindow(m.kickoff, now);
    const mine = myPredictionMap.get(m.id) ?? null;
    const predsForMatch = predictionIndex.get(m.id);

    let membersReveal: MatchView["membersReveal"] = null;
    let missingMemberNames: string[] | null = null;

    if (started) {
      membersReveal = memberships.map((mem) => ({
        userId: mem.userId,
        userName: mem.user.name ?? "Sin nombre",
        prediction: predsForMatch?.get(mem.userId) ?? null,
      }));
    } else if (withinWarning) {
      missingMemberNames = memberships
        .filter((mem) => !predsForMatch?.has(mem.userId))
        .map((mem) => mem.user.name ?? "Sin nombre");
    }

    return {
      id: m.id,
      kickoff: m.kickoff,
      status: m.status,
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      jornadaNumber: m.jornada.number,
      jornadaLabel: m.jornada.label,
      locked,
      started,
      isNext: nextKickoffMs != null && m.kickoff.getTime() === nextKickoffMs && m.status !== "FINISHED",
      myPrediction: mine,
      selfMissingWarning: withinWarning && !mine,
      membersReveal,
      missingMemberNames,
    };
  });

  return views;
}

export function groupJornadas(matches: MatchView[]) {
  const numbers = Array.from(new Set(matches.map((m) => m.jornadaNumber))).sort((a, b) => a - b);
  return numbers;
}

export function pickDefaultJornada(matches: MatchView[]): number {
  const withUnfinished = matches
    .filter((m) => m.status !== "FINISHED")
    .sort((a, b) => a.jornadaNumber - b.jornadaNumber);
  if (withUnfinished.length) return withUnfinished[0].jornadaNumber;
  const numbers = groupJornadas(matches);
  return numbers.length ? numbers[numbers.length - 1] : 1;
}
