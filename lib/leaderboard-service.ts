import { prisma } from "@/lib/prisma";
import { POINTS, computeClubMatchPoints } from "@/lib/scoring";

export type LeaderboardEntry = {
  userId: string;
  userName: string;
  userImage: string | null;
  points: number;
  played: number;
  exact: number;
};

export async function getClubLeaderboard(clubId: string): Promise<LeaderboardEntry[]> {
  const memberships = await prisma.membership.findMany({
    where: { clubId },
    include: { user: { select: { id: true, name: true, image: true } } },
  });
  const memberIds = memberships.map((m) => m.userId);

  const finishedMatches = await prisma.match.findMany({ where: { status: "FINISHED" } });
  const finishedIds = finishedMatches.map((m) => m.id);

  const predictions = finishedIds.length
    ? await prisma.prediction.findMany({
        where: { userId: { in: memberIds }, matchId: { in: finishedIds } },
      })
    : [];

  const predictionIndex = new Map<string, Map<string, { homeScore: number; awayScore: number }>>();
  for (const p of predictions) {
    if (!predictionIndex.has(p.userId)) predictionIndex.set(p.userId, new Map());
    predictionIndex.get(p.userId)!.set(p.matchId, { homeScore: p.homeScore, awayScore: p.awayScore });
  }

  const totals = new Map<string, { points: number; played: number; exact: number }>();
  for (const mem of memberships) totals.set(mem.userId, { points: 0, played: 0, exact: 0 });

  for (const match of finishedMatches) {
    if (match.homeScore == null || match.awayScore == null) continue;

    const memberPredictions = memberships.map((mem) => ({
      userId: mem.userId,
      prediction: predictionIndex.get(mem.userId)?.get(match.id) ?? null,
    }));
    const pointsByUser = computeClubMatchPoints(
      { homeScore: match.homeScore, awayScore: match.awayScore },
      memberPredictions,
    );

    for (const mem of memberships) {
      const pred = predictionIndex.get(mem.userId)?.get(match.id);
      if (!pred) continue;

      const entry = totals.get(mem.userId)!;
      entry.played++;
      const score = pointsByUser.get(mem.userId) ?? 0;
      entry.points += score;
      if (score === POINTS.EXACT || score === POINTS.EXACT + POINTS.UNIQUE_BONUS) entry.exact++;
    }
  }

  const entries: LeaderboardEntry[] = memberships.map((mem) => {
    const t = totals.get(mem.userId)!;
    return {
      userId: mem.userId,
      userName: mem.user.name ?? "Sin nombre",
      userImage: mem.user.image,
      points: t.points,
      played: t.played,
      exact: t.exact,
    };
  });

  return entries.sort((a, b) => b.points - a.points || b.exact - a.exact);
}
