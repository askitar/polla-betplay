// The pool ("la polla") only covers the regular round-robin of the Clausura:
// 19 fechas, every team against every team. What comes after it (the 8 that
// qualify, group stage, final) is deliberately NOT part of the pool.

/**
 * Highlightly names regular-season rounds "Clausura - 7" and the playoffs
 * "Clausura - Quarter-finals" / "Semi-finals" / "Final" (seen on the Apertura).
 * A prefix check would accept the playoffs, and since fixtures are matched by
 * team pair, a playoff game would overwrite the score of the regular-season
 * match between those same two teams and change the pool's final standings
 * after it had ended. So this has to be an exact shape, not a prefix, and a
 * fixture with no round info is rejected for the same reason.
 */
export function isRegularSeasonRound(round: string | null | undefined): boolean {
  return /^Clausura - \d+$/.test((round ?? "").trim());
}

/**
 * A hand-entered score only stands until the official result exists. Manual
 * scores were wrong often enough (typos, scores entered before the feed caught
 * up) to skew everyone's points, while the feed's final result has held up, so
 * once a fixture is officially finished its score replaces whatever is there.
 */
export function officialResultWins(status: string, officialHomeScore: number | null): boolean {
  return status === "FINISHED" && officialHomeScore !== null;
}

export type ProgressMatch = {
  jornadaNumber: number;
  status: string;
  kickoff: Date;
};

export type PollaProgress = {
  currentFecha: number;
  totalFechas: number;
  totalMatches: number;
  finished: number;
  remaining: number;
  live: number;
  postponed: number;
  /** Last dated pending match, or null if nothing pending has a real date. */
  lastKickoff: Date | null;
  isOver: boolean;
};

/**
 * Which fecha the league is on. Fechas are not played in order: single games
 * get moved far ahead (a Fecha 17 game was played during Fecha 13) or left
 * behind (a Fecha 13 game played during Fecha 15), so neither "highest fecha
 * with a played game" nor "lowest fecha with a pending game" is right.
 *
 * The league has reached a fecha once at least half its games were played.
 * Take the highest such fecha; if it still has games with a real date pending
 * it is the current one, otherwise the league has moved on to the next.
 */
function currentFechaOf(matches: ProgressMatch[]): number {
  const byFecha = new Map<number, ProgressMatch[]>();
  for (const m of matches) {
    if (!byFecha.has(m.jornadaNumber)) byFecha.set(m.jornadaNumber, []);
    byFecha.get(m.jornadaNumber)!.push(m);
  }
  const numbers = [...byFecha.keys()].sort((a, b) => a - b);
  if (numbers.length === 0) return 1;

  const reached = numbers.filter((n) => {
    const games = byFecha.get(n)!;
    const started = games.filter((g) => g.status === "FINISHED" || g.status === "LIVE").length;
    return started * 2 >= games.length;
  });
  if (reached.length === 0) return numbers[0];

  const anchor = reached[reached.length - 1];
  const stillPlaying = byFecha
    .get(anchor)!
    .some((g) => g.status === "SCHEDULED" || g.status === "LIVE");
  if (stillPlaying) return anchor;
  return numbers.find((n) => n > anchor) ?? anchor;
}

export function computePollaProgress(all: ProgressMatch[]): PollaProgress {
  // A cancelled match will never be played, so it can't hold the pool open.
  const matches = all.filter((m) => m.status !== "CANCELLED");
  const finished = matches.filter((m) => m.status === "FINISHED").length;
  const pending = matches.filter((m) => m.status !== "FINISHED");
  const dated = pending.filter((m) => m.status !== "POSTPONED");

  return {
    currentFecha: currentFechaOf(matches),
    totalFechas: Math.max(0, ...all.map((m) => m.jornadaNumber)),
    totalMatches: matches.length,
    finished,
    remaining: pending.length,
    live: pending.filter((m) => m.status === "LIVE").length,
    postponed: pending.filter((m) => m.status === "POSTPONED").length,
    lastKickoff: dated.length
      ? new Date(Math.max(...dated.map((m) => m.kickoff.getTime())))
      : null,
    isOver: matches.length > 0 && pending.length === 0,
  };
}
