import { prisma } from "@/lib/prisma";
import { isLocked, isStarted, isWithinWarningWindow, isSameColombiaDay } from "@/lib/match-time";
import { computeClubMatchPoints } from "@/lib/scoring";

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
  postponed: boolean;
  live: boolean;
  liveMinute: number | null;
  livePeriod: string | null;
  isNext: boolean;
  isToday: boolean;
  myPrediction: { homeScore: number; awayScore: number } | null;
  myPoints: number | null;
  myPointsIsLive: boolean;
  selfMissingWarning: boolean;
  membersReveal: Array<{
    userId: string;
    userName: string;
    prediction: { homeScore: number; awayScore: number } | null;
  }> | null;
  missingMemberNames: string[] | null;
  predictedCount: number;
  totalMembers: number;
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

  // Postponed/cancelled matches have no real kickoff anymore (Dimayor hasn't
  // announced a make-up date yet), so they're excluded from "next match" and
  // never lock — predictions stay open until someone sets a real date.
  const notFinished = matches.filter(
    (m) => m.status !== "FINISHED" && m.status !== "POSTPONED" && m.status !== "CANCELLED",
  );
  const futureKickoffs = notFinished
    .map((m) => m.kickoff.getTime())
    .filter((t) => t > now.getTime());
  const nextKickoffMs = futureKickoffs.length ? Math.min(...futureKickoffs) : null;

  // Existence-only (never scores) predictions for every club member, across
  // every match — used for the "X de Y ya predijeron" counter. This is safe
  // to compute regardless of kickoff time since it never exposes a guess.
  const allPredictions = memberIds.length
    ? await prisma.prediction.findMany({
        where: { matchId: { in: matches.map((m) => m.id) }, userId: { in: memberIds } },
        select: { matchId: true, userId: true },
      })
    : [];
  const existenceIndex = new Map<string, Set<string>>();
  for (const p of allPredictions) {
    if (!existenceIndex.has(p.matchId)) existenceIndex.set(p.matchId, new Set());
    existenceIndex.get(p.matchId)!.add(p.userId);
  }

  // Matches where we need to know OTHER members' actual scores: only once
  // locked (nobody can submit or change a prediction anymore, so seeing
  // others' picks can't influence anyone's own) — never before.
  const lockedMatchIds = matches
    .filter((m) => {
      if (m.status === "POSTPONED" || m.status === "CANCELLED") return false;
      return m.status === "FINISHED" || isLocked(m.kickoff, now);
    })
    .map((m) => m.id);
  const lockedPredictions = lockedMatchIds.length
    ? await prisma.prediction.findMany({
        where: { matchId: { in: lockedMatchIds }, userId: { in: memberIds } },
      })
    : [];
  const predictionIndex = new Map<string, Map<string, { homeScore: number; awayScore: number }>>();
  for (const p of lockedPredictions) {
    if (!predictionIndex.has(p.matchId)) predictionIndex.set(p.matchId, new Map());
    predictionIndex.get(p.matchId)!.set(p.userId, { homeScore: p.homeScore, awayScore: p.awayScore });
  }

  const views: MatchView[] = matches.map((m) => {
    const postponed = m.status === "POSTPONED" || m.status === "CANCELLED";
    const started = !postponed && (m.status === "FINISHED" || isStarted(m.kickoff, now));
    const locked = !postponed && (m.status === "FINISHED" || isLocked(m.kickoff, now));
    const withinWarning = !postponed && !started && isWithinWarningWindow(m.kickoff, now);
    const mine = myPredictionMap.get(m.id) ?? null;
    const predictedIds = existenceIndex.get(m.id);
    const predsForMatch = predictionIndex.get(m.id);

    let membersReveal: MatchView["membersReveal"] = null;
    let missingMemberNames: string[] | null = null;
    let myPoints: number | null = null;

    // While LIVE, score the current (not-yet-final) result too, so the
    // leaderboard can show provisional points that move with the match —
    // purely for excitement, the real score still wins once FINISHED.
    if ((m.status === "FINISHED" || m.status === "LIVE") && m.homeScore != null && m.awayScore != null) {
      const pointsByUser = computeClubMatchPoints(
        { homeScore: m.homeScore, awayScore: m.awayScore },
        memberships.map((mem) => ({
          userId: mem.userId,
          prediction: predsForMatch?.get(mem.userId) ?? null,
        })),
      );
      myPoints = mine ? (pointsByUser.get(userId) ?? null) : null;
    }

    if (locked) {
      membersReveal = memberships.map((mem) => ({
        userId: mem.userId,
        userName: mem.user.name ?? "Sin nombre",
        prediction: predsForMatch?.get(mem.userId) ?? null,
      }));
    } else if (withinWarning) {
      missingMemberNames = memberships
        .filter((mem) => !predictedIds?.has(mem.userId))
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
      postponed,
      live: m.status === "LIVE",
      liveMinute: m.status === "LIVE" ? m.liveMinute : null,
      livePeriod: m.status === "LIVE" ? m.livePeriod : null,
      isNext: !postponed && nextKickoffMs != null && m.kickoff.getTime() === nextKickoffMs,
      isToday: !postponed && isSameColombiaDay(m.kickoff, now),
      myPrediction: mine,
      myPoints,
      myPointsIsLive: m.status === "LIVE",
      selfMissingWarning: withinWarning && !mine,
      membersReveal,
      missingMemberNames,
      predictedCount: predictedIds?.size ?? 0,
      totalMembers: memberships.length,
    };
  });

  return views;
}

export function groupJornadas(matches: MatchView[]) {
  const numbers = Array.from(new Set(matches.map((m) => m.jornadaNumber))).sort((a, b) => a - b);
  return numbers;
}

export function pickDefaultJornada(matches: MatchView[]): number {
  // Sorted by kickoff, not jornadaNumber: a rescheduled match keeps its
  // original fecha number (e.g. a postponed Fecha 1 match resolved to a
  // real date months later is still "Fecha 1"), so picking by the lowest
  // jornadaNumber with a pending match would trap the default view on that
  // long-finished fecha forever. Sorting by kickoff instead always lands on
  // whichever fecha has the next real thing happening, regardless of what
  // number Dimayor originally assigned it to.
  //
  // A postponed match has no real kickoff to sort by and may sit unresolved
  // for weeks, so it's excluded the same way.
  const withPending = matches
    .filter((m) => m.status !== "FINISHED" && !m.postponed)
    .sort((a, b) => a.kickoff.getTime() - b.kickoff.getTime());
  if (withPending.length) return withPending[0].jornadaNumber;
  const numbers = groupJornadas(matches);
  return numbers.length ? numbers[numbers.length - 1] : 1;
}
