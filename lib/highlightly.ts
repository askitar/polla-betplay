import { prisma } from "@/lib/prisma";

const API_BASE = "https://soccer.highlightly.net";

// Highlightly's team names/spellings don't match ours (different rebrand
// timing, accents, shortenings) — matched by their numeric team id instead,
// confirmed one by one against api/leagues + api/standings for league 204173
// (Colombia Primera A / Liga BetPlay). "Internacional de Bogotá" still shows
// as "La Equidad FC" on Highlightly's side; that's the same club under its
// pre-2026 name (confirmed via press: La Equidad rebranded Dec 2025).
const TEAM_ID_TO_NAME: Record<number, string> = {
  968371: "Atlético Nacional",
  966669: "Junior",
  972626: "Deportes Tolima",
  970073: "Independiente Santa Fe",
  967520: "Once Caldas",
  969222: "América de Cali",
  959010: "Deportivo Pasto",
  959861: "Deportivo Cali",
  965818: "Internacional de Bogotá",
  958159: "Millonarios",
  960712: "Independiente Medellín",
  974328: "Águilas Doradas",
  1246648: "Llaneros",
  963265: "Atlético Bucaramanga",
  976881: "Fortaleza",
  964967: "Jaguares",
  971775: "Alianza FC",
  964116: "Boyacá Chicó",
  1251754: "Cúcuta Deportivo",
  1244946: "Deportivo Pereira",
};

const STATUS_MAP: Record<string, "SCHEDULED" | "LIVE" | "FINISHED" | "POSTPONED" | "CANCELLED"> = {
  "Not started": "SCHEDULED",
  "First half": "LIVE",
  Halftime: "LIVE",
  "Second half": "LIVE",
  "Extra time": "LIVE",
  Penalties: "LIVE",
  Interrupted: "LIVE",
  Suspended: "LIVE",
  Finished: "FINISHED",
  "Finished after extra time": "FINISHED",
  "Finished after penalties": "FINISHED",
  Postponed: "POSTPONED",
  Cancelled: "CANCELLED",
  Abandoned: "CANCELLED",
};

type HighlightlyMatch = {
  id: number;
  date: string;
  round?: string;
  state: {
    clock: number | null;
    description: string;
    score: { current: string | null; penalties: string | null };
  };
  homeTeam: { id: number; name: string };
  awayTeam: { id: number; name: string };
};

const NAME_TO_TEAM_ID: Record<string, number> = Object.fromEntries(
  Object.entries(TEAM_ID_TO_NAME).map(([id, name]) => [name, Number(id)]),
);

async function fetchHighlightly(path: string, params: Record<string, string>) {
  const apiKey = process.env.HIGHLIGHTLY_API_KEY;
  if (!apiKey) throw new Error("Falta configurar HIGHLIGHTLY_API_KEY.");

  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/${path}?${query}`, {
    headers: { "x-rapidapi-key": apiKey },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Highlightly respondió ${res.status}: ${await res.text()}`);
  }

  return res.json();
}

function parseScore(current: string | null): [number | null, number | null] {
  if (!current) return [null, null];
  const m = current.match(/(\d+)\s*-\s*(\d+)/);
  if (!m) return [null, null];
  return [Number(m[1]), Number(m[2])];
}

/**
 * Pulls matches for the configured league and updates status/live
 * score/clock on the matches we already track — never creates matches,
 * jornadas, or teams. Matching is by team id (mapped to our team names)
 * since fixtures are already seeded by hand for this league. MANUAL
 * corrections are never touched, same guarantee as the old API-Football
 * sync.
 */
export async function syncHighlightlyToday(now: Date = new Date()) {
  const leagueId = process.env.HIGHLIGHTLY_LEAGUE_ID;
  if (!leagueId) throw new Error("Falta configurar HIGHLIGHTLY_LEAGUE_ID.");

  // Highlightly's `date` filter is a UTC calendar day, NOT a Colombia
  // civil day — any kickoff at 19:00 COT or later (e.g. the usual 8:15pm
  // slot) lands on the *next* UTC date. Querying colombiaDateKey(now)
  // silently dropped every day's last match for its entire live window
  // (it was never "today" as Highlightly counts it). `now`'s own raw UTC
  // date is always correct for whatever's happening right now — the cron
  // guard only ever calls this within ~10min of a match's real kickoff,
  // so "now" and the match share the same UTC calendar day by then.
  const date = now.toISOString().slice(0, 10);
  const data = await fetchHighlightly("matches", { leagueId, date });
  const fixtures = (data.data ?? []) as HighlightlyMatch[];

  let updated = 0;
  let skippedManual = 0;
  let skippedNoMatch = 0;
  let skippedUnmapped = 0;
  let skippedUnknownStatus = 0;

  for (const f of fixtures) {
    const homeName = TEAM_ID_TO_NAME[f.homeTeam.id];
    const awayName = TEAM_ID_TO_NAME[f.awayTeam.id];
    if (!homeName || !awayName) {
      skippedUnmapped++;
      continue;
    }

    const status = STATUS_MAP[f.state.description];
    if (!status) {
      skippedUnknownStatus++;
      continue;
    }

    const [homeTeam, awayTeam] = await Promise.all([
      prisma.team.findUnique({ where: { name: homeName } }),
      prisma.team.findUnique({ where: { name: awayName } }),
    ]);
    if (!homeTeam || !awayTeam) {
      skippedUnmapped++;
      continue;
    }

    let existing = await prisma.match.findFirst({
      where: { homeTeamId: homeTeam.id, awayTeamId: awayTeam.id },
    });
    let swapped = false;
    if (!existing) {
      existing = await prisma.match.findFirst({
        where: { homeTeamId: awayTeam.id, awayTeamId: homeTeam.id },
      });
      swapped = true;
    }
    if (!existing) {
      skippedNoMatch++;
      continue;
    }
    if (existing.resultSource === "MANUAL") {
      skippedManual++;
      continue;
    }

    const [rawHome, rawAway] = parseScore(f.state.score.current);
    const homeScore = swapped ? rawAway : rawHome;
    const awayScore = swapped ? rawHome : rawAway;

    await prisma.match.update({
      where: { id: existing.id },
      data: {
        status,
        lastSyncedAt: new Date(),
        ...(status === "LIVE" || status === "FINISHED"
          ? {
              homeScore,
              awayScore,
              resultSource: "API" as const,
              liveMinute: status === "LIVE" ? f.state.clock : null,
              livePeriod: status === "LIVE" ? f.state.description : null,
            }
          : { liveMinute: null, livePeriod: null }),
      },
    });
    updated++;
  }

  return {
    total: fixtures.length,
    updated,
    skippedManual,
    skippedNoMatch,
    skippedUnmapped,
    skippedUnknownStatus,
  };
}

/**
 * Once-a-day check (see the cron route's daily window guard) for matches
 * we've marked POSTPONED: one Highlightly call per postponed match (by
 * team id pair, no date filter, so it finds the fixture whenever Dimayor
 * sets its date), and un-freezes it the moment a real status/date is
 * known. Cheap since postponements are rare — normally 0-1 calls/day.
 */
export async function checkPostponedMatches() {
  const leagueId = process.env.HIGHLIGHTLY_LEAGUE_ID;
  if (!leagueId) throw new Error("Falta configurar HIGHLIGHTLY_LEAGUE_ID.");

  const postponed = await prisma.match.findMany({
    where: { status: "POSTPONED" },
    include: { homeTeam: true, awayTeam: true },
  });

  let checked = 0;
  let resolved = 0;
  let stillPostponed = 0;
  let skippedManual = 0;
  let skippedUnmapped = 0;

  for (const m of postponed) {
    if (m.resultSource === "MANUAL") {
      skippedManual++;
      continue;
    }

    const homeId = NAME_TO_TEAM_ID[m.homeTeam.name];
    const awayId = NAME_TO_TEAM_ID[m.awayTeam.name];
    if (!homeId || !awayId) {
      skippedUnmapped++;
      continue;
    }

    const data = await fetchHighlightly("matches", {
      leagueId,
      homeTeamId: String(homeId),
      awayTeamId: String(awayId),
      season: "2026",
    });
    checked++;

    const fixtures = (data.data ?? []) as HighlightlyMatch[];
    const fixture = fixtures.find((f) => f.round?.startsWith("Clausura")) ?? fixtures[0];
    const status = fixture ? STATUS_MAP[fixture.state.description] : undefined;

    if (!fixture || !status || status === "POSTPONED") {
      stillPostponed++;
      continue;
    }

    const [rawHome, rawAway] = parseScore(fixture.state.score.current);

    await prisma.match.update({
      where: { id: m.id },
      data: {
        status,
        kickoff: new Date(fixture.date),
        lastSyncedAt: new Date(),
        ...(status === "LIVE" || status === "FINISHED"
          ? {
              homeScore: rawHome,
              awayScore: rawAway,
              resultSource: "API" as const,
              liveMinute: status === "LIVE" ? fixture.state.clock : null,
              livePeriod: status === "LIVE" ? fixture.state.description : null,
            }
          : {}),
      },
    });
    resolved++;
  }

  return { checked, resolved, stillPostponed, skippedManual, skippedUnmapped };
}
