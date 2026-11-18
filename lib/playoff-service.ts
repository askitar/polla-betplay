import { getPlayoffEntries, getTournamentMatches } from "@/lib/club-data";
import { computePlayoffProgress, computeTable, type TableRow } from "@/lib/playoffs";

export type PlayoffState = {
  /** True once the cuadrangulares exist (their first fixtures were synced). */
  active: boolean;
  /** This viewer's decision in this club: null = not answered yet. */
  decision: { accepted: boolean } | null;
  participants: number;
};

/** Everything here reuses the per-request cached reads (lib/club-data.ts). */
export async function getPlayoffState(clubId: string, userId: string): Promise<PlayoffState> {
  const [matches, entries] = await Promise.all([
    getTournamentMatches("cuadrangulares"),
    getPlayoffEntries(clubId),
  ]);
  const mine = entries.find((e) => e.userId === userId);
  return {
    active: matches.length > 0,
    decision: mine ? { accepted: mine.accepted } : null,
    participants: entries.filter((e) => e.accepted).length,
  };
}

export async function getPlayoffProgress() {
  const matches = await getTournamentMatches("cuadrangulares");
  return computePlayoffProgress(matches.map((m) => ({ jornadaNumber: m.jornada.number, status: m.status })));
}

export type GroupTable = { group: string; rows: TableRow[] };

/** The two real cuadrangular tables (Dimayor's, not the pool's), computed from results. */
export async function getGroupTables(): Promise<GroupTable[]> {
  const matches = await getTournamentMatches("cuadrangulares");
  const groups = new Map<string, { teams: Set<string>; games: typeof matches }>();
  for (const m of matches) {
    if (!m.groupName) continue;
    if (!groups.has(m.groupName)) groups.set(m.groupName, { teams: new Set(), games: [] });
    const g = groups.get(m.groupName)!;
    g.teams.add(m.homeTeam.name);
    g.teams.add(m.awayTeam.name);
    g.games.push(m);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([group, { teams, games }]) => ({
      group,
      rows: computeTable(
        [...teams],
        games.map((m) => ({
          home: m.homeTeam.name,
          away: m.awayTeam.name,
          homeScore: m.homeScore,
          awayScore: m.awayScore,
          status: m.status,
        })),
      ),
    }));
}
