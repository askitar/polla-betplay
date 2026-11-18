import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { LEAGUE_SEASON_KEY, PLAYOFF_SEASON_KEY } from "@/lib/playoffs";

/**
 * Shared, per-request-deduplicated loaders for the three big reads every
 * club page needs.
 *
 * Why this exists: /partidos, /cronograma and /clasificacion each used to
 * call two or three services that independently re-queried the same rows —
 * the full match list, the club's memberships, and the members' predictions
 * — so a single page render cost ~11 database round trips, and the live
 * auto-refresh repeated all of them every few seconds per open tab. That
 * load is what exhausted the database's monthly compute quota and took the
 * whole site down (nobody could even log in, since sessions are stored in
 * the database too).
 *
 * React's `cache()` memoizes per request, so these run at most once per
 * page render no matter how many services ask for them, and callers filter
 * in memory instead of issuing another query.
 */

export const getAllMatches = cache(async () =>
  prisma.match.findMany({
    include: { homeTeam: true, awayTeam: true, jornada: true },
    orderBy: { kickoff: "asc" },
  }),
);

export const getClubMemberships = cache(async (clubId: string) =>
  prisma.membership.findMany({
    where: { clubId },
    include: { user: { select: { id: true, name: true, image: true } } },
  }),
);

/**
 * Every prediction belonging to this club's members, across every match —
 * one query that replaces the four differently-scoped prediction queries
 * the services used to run. Bounded by members x matches (a few thousand
 * rows at most for this league), so fetching it whole is cheaper than
 * issuing several narrower queries.
 */
export const getClubPredictions = cache(async (clubId: string) => {
  const memberships = await getClubMemberships(clubId);
  const memberIds = memberships.map((m) => m.userId);
  if (memberIds.length === 0) return [];
  return prisma.prediction.findMany({ where: { userId: { in: memberIds } } });
});

// ---------------------------------------------------------------------------
// Tournaments: the base league and the cuadrangulares live in separate
// Seasons, so every service picks one with `torneo` and filters the shared,
// already-cached match list in memory (no extra match query per tournament).

export type Torneo = "liga" | "cuadrangulares";

export const getSeasonIds = cache(async () => {
  const seasons = await prisma.season.findMany({
    where: { externalId: { in: [LEAGUE_SEASON_KEY, PLAYOFF_SEASON_KEY] } },
    select: { id: true, externalId: true },
  });
  return {
    liga: seasons.find((s) => s.externalId === LEAGUE_SEASON_KEY)?.id ?? null,
    cuadrangulares: seasons.find((s) => s.externalId === PLAYOFF_SEASON_KEY)?.id ?? null,
  };
});

export const getTournamentMatches = cache(async (torneo: Torneo) => {
  const [all, ids] = await Promise.all([getAllMatches(), getSeasonIds()]);
  const seasonId = ids[torneo];
  if (!seasonId) return [];
  return all.filter((m) => m.jornada.seasonId === seasonId);
});

/** Every yes/no decision on the cuadrangulares for this club. */
export const getPlayoffEntries = cache(async (clubId: string) => {
  const { cuadrangulares } = await getSeasonIds();
  if (!cuadrangulares) return [];
  return prisma.tournamentEntry.findMany({ where: { clubId, seasonId: cuadrangulares } });
});

/**
 * Who plays a tournament: every member for the league, only those who said
 * yes for the cuadrangulares. Everything downstream (table, "who predicted",
 * the unique-exact bonus) is computed over this list, so someone who did
 * not join can never take a bonus away from someone who did.
 */
export const getTournamentMembers = cache(async (clubId: string, torneo: Torneo) => {
  const memberships = await getClubMemberships(clubId);
  if (torneo === "liga") return memberships;
  const entries = await getPlayoffEntries(clubId);
  const accepted = new Set(entries.filter((e) => e.accepted).map((e) => e.userId));
  return memberships.filter((m) => accepted.has(m.userId));
});
