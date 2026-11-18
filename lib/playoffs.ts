// Pure logic for the cuadrangulares pool: no database, no network, so all of
// it is covered by lib/playoffs.test.ts.

/** Our Season.externalId for the base league and for the cuadrangulares. */
export const LEAGUE_SEASON_KEY = "manual-2026-II";
export const PLAYOFF_SEASON_KEY = "cuadrangulares-2026-II";

/** 6 group fechas (each pair home and away) plus a two-leg final. */
export const GROUP_FECHAS = 6;
export const FINAL_FIRST_JORNADA = GROUP_FECHAS + 1; // 7 = ida, 8 = vuelta
export const PLAYOFF_EXPECTED_MATCHES = 2 * 6 + 2; // two groups of 4: 6 games each, plus the final

export type PlayoffRound = { kind: "group"; fecha: number } | { kind: "final" };

/**
 * Highlightly names the cuadrangulares "Clausura - Quadrangular - 3" and the
 * final "Clausura - Final" (same shape it used for the Apertura). Anything
 * else (a regular "Clausura - 7", Apertura rounds) is not ours here.
 */
export function parsePlayoffRound(round: string | null | undefined): PlayoffRound | null {
  const r = (round ?? "").trim();
  const group = r.match(/^Clausura - Quadrangular - (\d+)$/);
  if (group) {
    const fecha = Number(group[1]);
    return fecha >= 1 && fecha <= GROUP_FECHAS ? { kind: "group", fecha } : null;
  }
  if (/^Clausura - Finals?$/.test(r)) return { kind: "final" };
  return null;
}

export function playoffStageLabel(jornadaNumber: number, groupName: string | null): string {
  if (jornadaNumber === FINAL_FIRST_JORNADA) return "Final · ida";
  if (jornadaNumber === FINAL_FIRST_JORNADA + 1) return "Final · vuelta";
  return groupName ? `Grupo ${groupName} · Fecha ${jornadaNumber}` : `Fecha ${jornadaNumber}`;
}

/**
 * Splits the teams into the two groups from who plays whom: in a group of
 * four everyone meets everyone, so the fixtures form two connected
 * components. Returns null until the fixtures connect into exactly two.
 *
 * Group A is the one holding the team ranked best in `seedOrder` (the league
 * table), which is how Dimayor heads the groups: 1st place leads A.
 */
export function inferGroups(
  pairs: Array<[string, string]>,
  seedOrder: string[],
): Map<string, "A" | "B"> | null {
  const parent = new Map<string, string>();
  const find = (x: string): string => {
    if (!parent.has(x)) parent.set(x, x);
    const p = parent.get(x)!;
    if (p === x) return x;
    const root = find(p);
    parent.set(x, root);
    return root;
  };
  for (const [a, b] of pairs) parent.set(find(a), find(b));

  const components = new Map<string, string[]>();
  for (const team of parent.keys()) {
    const root = find(team);
    if (!components.has(root)) components.set(root, []);
    components.get(root)!.push(team);
  }
  if (components.size !== 2) return null;

  const rank = (t: string) => {
    const i = seedOrder.indexOf(t);
    return i === -1 ? Number.MAX_SAFE_INTEGER : i;
  };
  const [first, second] = [...components.values()].sort(
    (x, y) => Math.min(...x.map(rank)) - Math.min(...y.map(rank)),
  );
  const out = new Map<string, "A" | "B">();
  first.forEach((t) => out.set(t, "A"));
  second.forEach((t) => out.set(t, "B"));
  return out;
}

export type TableMatch = {
  home: string;
  away: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
};

export type TableRow = {
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
  position: number;
};

/**
 * Football table, 3/1/0, ordered by points, then goal difference, then goals
 * scored, then name. Only FINISHED games count; `teams` seeds every row so a
 * team with no games yet still shows up with zeros. This is the plain
 * result-based table: if Dimayor applies any extra bonus or tiebreak, it is
 * not reflected here.
 */
export function computeTable(teams: string[], matches: TableMatch[]): TableRow[] {
  const rows = new Map<string, Omit<TableRow, "position" | "goalDiff">>();
  const row = (t: string) => {
    if (!rows.has(t)) {
      rows.set(t, { team: t, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0 });
    }
    return rows.get(t)!;
  };
  teams.forEach(row);

  for (const m of matches) {
    if (m.status !== "FINISHED" || m.homeScore == null || m.awayScore == null) continue;
    const h = row(m.home);
    const a = row(m.away);
    h.played++;
    a.played++;
    h.goalsFor += m.homeScore;
    h.goalsAgainst += m.awayScore;
    a.goalsFor += m.awayScore;
    a.goalsAgainst += m.homeScore;
    if (m.homeScore > m.awayScore) {
      h.won++;
      a.lost++;
      h.points += 3;
    } else if (m.homeScore < m.awayScore) {
      a.won++;
      h.lost++;
      a.points += 3;
    } else {
      h.drawn++;
      a.drawn++;
      h.points += 1;
      a.points += 1;
    }
  }

  return [...rows.values()]
    .map((r) => ({ ...r, goalDiff: r.goalsFor - r.goalsAgainst }))
    .sort(
      (x, y) =>
        y.points - x.points ||
        y.goalDiff - x.goalDiff ||
        y.goalsFor - x.goalsFor ||
        x.team.localeCompare(y.team),
    )
    .map((r, i) => ({ ...r, position: i + 1 }));
}

export type PlayoffProgress = {
  /** 1-6 while in groups, 7/8 for the final legs, 0 before anything exists. */
  currentJornada: number;
  label: string;
  finished: number;
  live: number;
  /** Against the full expected bracket, not just the fixtures published so far. */
  remaining: number;
  total: number;
  isOver: boolean;
};

export function computePlayoffProgress(
  matches: Array<{ jornadaNumber: number; status: string }>,
): PlayoffProgress {
  const playable = matches.filter((m) => m.status !== "CANCELLED");
  const finished = playable.filter((m) => m.status === "FINISHED").length;
  const live = playable.filter((m) => m.status === "LIVE").length;
  const pending = playable.filter((m) => m.status !== "FINISHED");
  const total = Math.max(PLAYOFF_EXPECTED_MATCHES, playable.length);

  const currentJornada = pending.length
    ? Math.min(...pending.map((m) => m.jornadaNumber))
    : playable.length
      ? Math.max(...playable.map((m) => m.jornadaNumber))
      : 0;

  const label =
    currentJornada === 0
      ? "Por empezar"
      : currentJornada >= FINAL_FIRST_JORNADA
        ? currentJornada === FINAL_FIRST_JORNADA
          ? "Final · ida"
          : "Final · vuelta"
        : `Fecha ${currentJornada} de ${GROUP_FECHAS}`;

  return {
    currentJornada,
    label,
    finished,
    live,
    remaining: total - finished,
    total,
    isOver: finished >= PLAYOFF_EXPECTED_MATCHES && pending.length === 0,
  };
}

export type EntryDecision = { accepted: boolean } | null;

/**
 * The only allowed transitions: undecided to yes or no, and no to yes.
 * Once someone has accepted, it is final (Oscar's rule), so a later "no"
 * is refused instead of silently pulling them out of the table.
 */
export function canChangeEntry(current: EntryDecision, next: boolean): boolean {
  if (current?.accepted) return next === true;
  return true;
}
