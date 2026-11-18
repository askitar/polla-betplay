import { POINTS, computeClubMatchBreakdown } from "@/lib/scoring";
import { getClubPredictions, getTournamentMatches, getTournamentMembers, type Torneo } from "@/lib/club-data";

export type PlayerMatchDetail = {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  kickoff: Date;
  isLive: boolean;
  predictionHome: number;
  predictionAway: number;
  exact: boolean;
  winner: boolean;
  goal: boolean;
  uniqueBonus: boolean;
  points: number;
};

export type PlayerStatsSummary = {
  exactCount: number;
  exactSubtotal: number;
  winnerCount: number;
  winnerSubtotal: number;
  goalCount: number;
  goalSubtotal: number;
  uniqueCount: number;
  uniqueSubtotal: number;
  total: number;
};

export type PlayerStats = {
  summary: PlayerStatsSummary;
  matches: PlayerMatchDetail[];
};

/**
 * Per-member stats for every member of a club in one pass: each finished
 * match's club-wide breakdown (needed for the "predicción única" bonus) is
 * computed once and reused for every member, instead of recomputing it once
 * per member.
 */
export async function getClubMemberStatsMap(
  clubId: string,
  torneo: Torneo = "liga",
): Promise<Map<string, PlayerStats>> {
  // Shared per-request with the leaderboard service (lib/club-data.ts) —
  // the clasificacion page renders both, and this used to mean running the
  // same three queries twice.
  const [memberships, allMatches, predictions] = await Promise.all([
    getTournamentMembers(clubId, torneo),
    getTournamentMatches(torneo),
    getClubPredictions(clubId),
  ]);
  const memberIds = memberships.map((m) => m.userId);

  // LIVE matches are included using their current score — provisional, so a
  // player's per-match breakdown here can still change until the match ends.
  const scoredMatches = allMatches
    .filter((m) => m.status === "FINISHED" || m.status === "LIVE")
    .sort((a, b) => b.kickoff.getTime() - a.kickoff.getTime());
  const scoredIds = new Set(scoredMatches.map((m) => m.id));

  const predictionIndex = new Map<string, Map<string, { homeScore: number; awayScore: number }>>();
  for (const p of predictions) {
    if (!scoredIds.has(p.matchId)) continue;
    if (!predictionIndex.has(p.matchId)) predictionIndex.set(p.matchId, new Map());
    predictionIndex.get(p.matchId)!.set(p.userId, { homeScore: p.homeScore, awayScore: p.awayScore });
  }

  const statsByUser = new Map<string, PlayerStats>();
  for (const userId of memberIds) {
    statsByUser.set(userId, {
      summary: {
        exactCount: 0,
        exactSubtotal: 0,
        winnerCount: 0,
        winnerSubtotal: 0,
        goalCount: 0,
        goalSubtotal: 0,
        uniqueCount: 0,
        uniqueSubtotal: 0,
        total: 0,
      },
      matches: [],
    });
  }

  for (const match of scoredMatches) {
    if (match.homeScore == null || match.awayScore == null) continue;
    const predsForMatch = predictionIndex.get(match.id);

    const breakdown = computeClubMatchBreakdown(
      { homeScore: match.homeScore, awayScore: match.awayScore },
      memberIds.map((userId) => ({ userId, prediction: predsForMatch?.get(userId) ?? null })),
    );

    for (const userId of memberIds) {
      const pred = predsForMatch?.get(userId);
      if (!pred) continue;
      const b = breakdown.get(userId);
      if (!b) continue;

      const stats = statsByUser.get(userId)!;
      stats.matches.push({
        matchId: match.id,
        homeTeam: match.homeTeam.name,
        awayTeam: match.awayTeam.name,
        homeScore: match.homeScore,
        awayScore: match.awayScore,
        kickoff: match.kickoff,
        isLive: match.status === "LIVE",
        predictionHome: pred.homeScore,
        predictionAway: pred.awayScore,
        exact: b.exact,
        winner: b.winner,
        goal: b.goal,
        uniqueBonus: b.uniqueBonus,
        points: b.total,
      });

      if (b.exact) {
        stats.summary.exactCount++;
        stats.summary.exactSubtotal += POINTS.EXACT;
      }
      if (b.winner) {
        stats.summary.winnerCount++;
        stats.summary.winnerSubtotal += POINTS.WINNER;
      }
      if (b.goal) {
        stats.summary.goalCount++;
        stats.summary.goalSubtotal += POINTS.GOAL;
      }
      if (b.uniqueBonus) {
        stats.summary.uniqueCount++;
        stats.summary.uniqueSubtotal += POINTS.UNIQUE_BONUS;
      }
      stats.summary.total += b.total;
    }
  }

  return statsByUser;
}
