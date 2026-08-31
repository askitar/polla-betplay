import { cache } from "react";
import { prisma } from "@/lib/prisma";

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
