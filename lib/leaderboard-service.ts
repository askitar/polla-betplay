import { computeClubMatchBreakdown } from "@/lib/scoring";
import { rankEntries } from "@/lib/ranking";
import { getClubPredictions, getTournamentMatches, getTournamentMembers, type Torneo } from "@/lib/club-data";

export type LeaderboardEntry = {
  userId: string;
  userName: string;
  userImage: string | null;
  points: number;
  played: number;
  exact: number;
  rank: number;
  /** Points earned in the most recent scored match, null if they had no prediction on it. */
  lastPoints: number | null;
};

export type LastScoredMatch = {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  isLive: boolean;
};

export async function getClubLeaderboard(clubId: string, torneo: Torneo = "liga"): Promise<{
  entries: LeaderboardEntry[];
  hasLiveMatch: boolean;
  lastMatch: LastScoredMatch | null;
}> {
  // Shared per-request with the matches/stats services (lib/club-data.ts),
  // so rendering a page that shows both the table and the fixtures reads
  // each of these once rather than twice.
  const [memberships, allMatches, predictions] = await Promise.all([
    getTournamentMembers(clubId, torneo),
    getTournamentMatches(torneo),
    getClubPredictions(clubId),
  ]);

  // LIVE matches count toward the table too, using their current
  // (not-yet-final) score: provisional points that move as the match does,
  // replaced by the real result once the match ends.
  const scoredMatches = allMatches.filter(
    (m) => (m.status === "FINISHED" || m.status === "LIVE") && m.homeScore != null && m.awayScore != null,
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

  // The latest kickoff among scored matches is "the last match" everyone is
  // asking about after a round: what did each person get out of it.
  const latest = scoredMatches.reduce<(typeof scoredMatches)[number] | null>(
    (best, m) => (!best || m.kickoff.getTime() > best.kickoff.getTime() ? m : best),
    null,
  );
  const lastPointsByUser = new Map<string, number | null>();

  for (const match of scoredMatches) {
    const memberPredictions = memberships.map((mem) => ({
      userId: mem.userId,
      prediction: predictionIndex.get(mem.userId)?.get(match.id) ?? null,
    }));
    const breakdownByUser = computeClubMatchBreakdown(
      { homeScore: match.homeScore!, awayScore: match.awayScore! },
      memberPredictions,
    );

    for (const mem of memberships) {
      const pred = predictionIndex.get(mem.userId)?.get(match.id);
      const b = breakdownByUser.get(mem.userId);
      if (match.id === latest?.id) lastPointsByUser.set(mem.userId, pred && b ? b.total : null);
      if (!pred || !b) continue;

      const entry = totals.get(mem.userId)!;
      entry.played++;
      entry.points += b.total;
      if (b.exact) entry.exact++;
    }
  }

  const unranked = memberships.map((mem) => {
    const t = totals.get(mem.userId)!;
    return {
      userId: mem.userId,
      userName: mem.user.name ?? "Sin nombre",
      userImage: mem.user.image,
      points: t.points,
      played: t.played,
      exact: t.exact,
      lastPoints: lastPointsByUser.get(mem.userId) ?? null,
    };
  });

  return {
    entries: rankEntries(unranked),
    hasLiveMatch,
    lastMatch: latest
      ? {
          homeTeam: latest.homeTeam.name,
          awayTeam: latest.awayTeam.name,
          homeScore: latest.homeScore!,
          awayScore: latest.awayScore!,
          isLive: latest.status === "LIVE",
        }
      : null,
  };
}
