export type RankStats = {
  points: number;
  exact: number;
  winners: number;
  goals: number;
  uniques: number;
};

/** The published tiebreak order, see "Criterios de desempate" on /clasificacion. */
export function compareRanking(a: RankStats, b: RankStats): number {
  return (
    b.points - a.points ||
    b.exact - a.exact ||
    b.winners - a.winners ||
    b.goals - a.goals ||
    b.uniques - a.uniques
  );
}

/**
 * Sorts and assigns positions. Players still level after every tiebreak share
 * a position, as the rules promise, and the next position skips accordingly
 * (1, 2, 2, 4), so a tie is never settled by database row order.
 */
export function rankEntries<T extends RankStats>(entries: T[]): Array<T & { rank: number }> {
  const sorted = [...entries].sort(compareRanking);
  const ranked: Array<T & { rank: number }> = [];
  sorted.forEach((entry, i) => {
    const previous = ranked[i - 1];
    const rank = previous && compareRanking(previous, entry) === 0 ? previous.rank : i + 1;
    ranked.push({ ...entry, rank });
  });
  return ranked;
}
