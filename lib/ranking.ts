export type RankStats = {
  userName: string;
  points: number;
  exact: number;
};

/**
 * Only points decide a position: players level on points share it and the next
 * position skips accordingly (1, 1, 3 or 1, 2, 2). Exact scores and the name
 * only order the rows within a shared position, so the list stays stable.
 */
export function rankEntries<T extends RankStats>(entries: T[]): Array<T & { rank: number }> {
  const sorted = [...entries].sort(
    (a, b) => b.points - a.points || b.exact - a.exact || a.userName.localeCompare(b.userName),
  );
  const ranked: Array<T & { rank: number }> = [];
  sorted.forEach((entry, i) => {
    const previous = ranked[i - 1];
    const rank = previous && previous.points === entry.points ? previous.rank : i + 1;
    ranked.push({ ...entry, rank });
  });
  return ranked;
}
