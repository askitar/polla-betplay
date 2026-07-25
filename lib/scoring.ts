export type ScoreResult = { homeScore: number; awayScore: number };

export const POINTS = {
  EXACT: 5,
  WINNER: 2,
  GOAL: 1,
  UNIQUE_BONUS: 2,
} as const;

export type PointsBreakdown = {
  exact: boolean;
  winner: boolean;
  goal: boolean;
  uniqueBonus: boolean;
  total: number;
};

const EMPTY_BREAKDOWN: PointsBreakdown = {
  exact: false,
  winner: false,
  goal: false,
  uniqueBonus: false,
  total: 0,
};

/**
 * Marcador exacto is its own top case and excludes everything else. Short
 * of that, ganador/empate acertado and gol acertado are independent checks
 * that both apply and stack when they both hit — e.g. real 2-1, predicted
 * 2-0: winner is right (+2) AND the home goal count is right (+1), for +3.
 * (Home and away can't both match without it being an exact score, so this
 * never double-counts a single match as two goal hits.)
 */
function computeBreakdown(prediction: ScoreResult, result: ScoreResult): PointsBreakdown {
  if (prediction.homeScore === result.homeScore && prediction.awayScore === result.awayScore) {
    return { exact: true, winner: false, goal: false, uniqueBonus: false, total: POINTS.EXACT };
  }

  const predictedSign = Math.sign(prediction.homeScore - prediction.awayScore);
  const resultSign = Math.sign(result.homeScore - result.awayScore);
  const winner = predictedSign === resultSign;
  const goal = prediction.homeScore === result.homeScore || prediction.awayScore === result.awayScore;

  return {
    exact: false,
    winner,
    goal,
    uniqueBonus: false,
    total: (winner ? POINTS.WINNER : 0) + (goal ? POINTS.GOAL : 0),
  };
}

export function computePointsBreakdown(
  prediction: ScoreResult | null | undefined,
  result: ScoreResult | null | undefined,
): PointsBreakdown | null {
  if (!prediction || !result) return null;
  return computeBreakdown(prediction, result);
}

export function computePoints(
  prediction: ScoreResult | null | undefined,
  result: ScoreResult | null | undefined,
): number | null {
  return computePointsBreakdown(prediction, result)?.total ?? null;
}

/**
 * Breakdown for every club member on one finished match, including the
 * "predicción única" bonus — the only case where points stack on top of an
 * already-computed tier. If exactly one member of the club nailed the exact
 * scoreline, that member's breakdown gets uniqueBonus=true and
 * EXACT + UNIQUE_BONUS; everyone else keeps their plain breakdown.
 */
export function computeClubMatchBreakdown(
  result: ScoreResult,
  memberPredictions: Array<{ userId: string; prediction: ScoreResult | null }>,
): Map<string, PointsBreakdown> {
  const breakdowns = new Map<string, PointsBreakdown>();
  let soleExactUserId: string | null = null;
  let exactCount = 0;

  for (const { userId, prediction } of memberPredictions) {
    const b = prediction ? computeBreakdown(prediction, result) : EMPTY_BREAKDOWN;
    breakdowns.set(userId, b);
    if (b.exact) {
      exactCount++;
      soleExactUserId = userId;
    }
  }

  if (exactCount === 1 && soleExactUserId) {
    const b = breakdowns.get(soleExactUserId)!;
    breakdowns.set(soleExactUserId, { ...b, uniqueBonus: true, total: b.total + POINTS.UNIQUE_BONUS });
  }

  return breakdowns;
}

export function computeClubMatchPoints(
  result: ScoreResult,
  memberPredictions: Array<{ userId: string; prediction: ScoreResult | null }>,
): Map<string, number> {
  const breakdowns = computeClubMatchBreakdown(result, memberPredictions);
  const points = new Map<string, number>();
  for (const [userId, b] of breakdowns) points.set(userId, b.total);
  return points;
}
