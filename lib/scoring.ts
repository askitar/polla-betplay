export type ScoreResult = { homeScore: number; awayScore: number };

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
    return 5;
  }

  const predictedSign = Math.sign(prediction.homeScore - prediction.awayScore);
  const resultSign = Math.sign(result.homeScore - result.awayScore);
  if (predictedSign === resultSign) {
    return 2;
  }

  if (prediction.homeScore === result.homeScore || prediction.awayScore === result.awayScore) {
    return 1;
  }

  return 0;
}
