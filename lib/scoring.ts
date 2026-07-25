export type ScoreResult = { homeScore: number; awayScore: number };

export const POINTS = {
  EXACT: 5,
  WINNER: 2,
  GOAL: 1,
  UNIQUE_BONUS: 2,
} as const;

/**
 * Tiered scoring: only the highest tier that applies counts (they don't
 * stack). 5 pts exact scoreline, 2 pts correct winner/draw without the exact
 * score, 1 pt for matching just one team's goal count, 0 otherwise.
 */
export function computePoints(
  prediction: ScoreResult | null | undefined,
  result: ScoreResult | null | undefined,
): number | null {
  if (!prediction || !result) return null;

  if (
    prediction.homeScore === result.homeScore &&
    prediction.awayScore === result.awayScore
  ) {
    return POINTS.EXACT;
  }

  const predictedSign = Math.sign(prediction.homeScore - prediction.awayScore);
  const resultSign = Math.sign(result.homeScore - result.awayScore);
  if (predictedSign === resultSign) {
    return POINTS.WINNER;
  }

  if (prediction.homeScore === result.homeScore || prediction.awayScore === result.awayScore) {
    return POINTS.GOAL;
  }

  return 0;
}

/**
 * Points for every club member on one finished match, including the
 * "predicción única" bonus — the only case where points stack. If exactly
 * one member of the club nailed the exact scoreline, that member gets
 * EXACT + UNIQUE_BONUS instead of just EXACT; everyone else gets their plain
 * tiered score.
 */
export function computeClubMatchPoints(
  result: ScoreResult,
  memberPredictions: Array<{ userId: string; prediction: ScoreResult | null }>,
): Map<string, number> {
  const points = new Map<string, number>();
  let soleExactUserId: string | null = null;
  let exactCount = 0;

  for (const { userId, prediction } of memberPredictions) {
    const base = computePoints(prediction, result) ?? 0;
    points.set(userId, base);
    if (base === POINTS.EXACT) {
      exactCount++;
      soleExactUserId = userId;
    }
  }

  if (exactCount === 1 && soleExactUserId) {
    points.set(soleExactUserId, POINTS.EXACT + POINTS.UNIQUE_BONUS);
  }

  return points;
}
