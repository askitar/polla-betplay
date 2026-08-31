import { POINTS, computeClubMatchPoints } from "@/lib/scoring";
import { getAllMatches, getClubMemberships, getClubPredictions } from "@/lib/club-data";

export type LeaderboardEntry = {
  userId: string;
  userName: string;
  userImage: string | null;
  points: number;
  played: number;
  exact: number;
};

export async function getClubLeaderboard(
  clubId: string,
): Promise<{ entries: LeaderboardEntry[]; hasLiveMatch: boolean }> {
  // Shared per-request with the matches/stats services (lib/club-data.ts),
  // so rendering a page that shows both the table and the fixtures reads
  // each of these once rather than twice.
  const [memberships, allMatches, predictions] = await Promise.all([
    getClubMemberships(clubId),
    getAllMatches(),
    getClubPredictions(clubId),
  ]);

  // LIVE matches count toward the table too, using their current
  // (not-yet-final) score — provisional points that move as the match does,
  // for excitement, replaced by the real result once the match ends.
  const scoredMatches = allMatches.filter(
    (m) => m.status === "FINISHED" || m.status === "LIVE",
  );
  const scoredIds = new Set(scoredMatches.map((m) => m.id));
  const hasLiveMatch = scoredMatches.some((m) => m.status === "LIVE");

  const predictionIndex = new Map<string, Map<string, { homeScore: number; awayScore: number }>>();
  for (const p of predictions) {
    if (!scoredIds.has(p.matchId)) continue;
    if (!predictionIndex.has(p.userId)) predictionIndex.set(p.userId, new Map());
    predictionIndex.get(p.userId)!.set(p.matchId, { homeScore: p.homeScore, awayScore: p.awayScore });
  }

  const totals = new Map<string, { points: number; played: number; exact: number }>();
  for (const mem of memberships) totals.set(mem.userId, { points: 0, played: 0, exact: 0 });

  for (const match of scoredMatches) {
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

  entries.sort((a, b) => b.points - a.points || b.exact - a.exact);
  return { entries, hasLiveMatch };
}
