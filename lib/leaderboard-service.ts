import { prisma } from "@/lib/prisma";
import { computePoints } from "@/lib/scoring";

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

  const entries: LeaderboardEntry[] = memberships.map((mem) => {
    let points = 0;
    let played = 0;
    let exact = 0;

    for (const match of finishedMatches) {
      if (match.homeScore == null || match.awayScore == null) continue;
      const pred = predictionIndex.get(mem.userId)?.get(match.id);
      if (!pred) continue;

      played++;
      const score = computePoints(pred, { homeScore: match.homeScore, awayScore: match.awayScore });
      points += score ?? 0;
      if (score === 3) exact++;
    }

    return {
      userId: mem.userId,
      userName: mem.user.name ?? "Sin nombre",
      userImage: mem.user.image,
      points,
      played,
      exact,
    };
  });

  return entries.sort((a, b) => b.points - a.points || b.exact - a.exact);
}
