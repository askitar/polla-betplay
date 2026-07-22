import { prisma } from "@/lib/prisma";

const API_BASE = "https://v3.football.api-sports.io";

type ApiFixture = {
  fixture: { id: number; date: string; status: { short: string } };
  league: { round: string };
  teams: {
    home: { id: number; name: string };
    away: { id: number; name: string };
  };
  goals: { home: number | null; away: number | null };
};

async function fetchApiFootball(path: string, params: Record<string, string>) {
  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) throw new Error("Falta configurar API_FOOTBALL_KEY.");

  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/${path}?${query}`, {
    headers: { "x-apisports-key": apiKey },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`API-Football respondió ${res.status}: ${await res.text()}`);
  }

  return res.json();
}

/** One-off lookup to confirm the real league id before wiring the recurring sync. */
export async function findLeagues(country: string) {
  const data = await fetchApiFootball("leagues", { country });
  return (data.response as Array<{ league: { id: number; name: string }; seasons: Array<{ year: number; current: boolean }> }>).map(
    (r) => ({ id: r.league.id, name: r.league.name, seasons: r.seasons }),
  );
}

const STATUS_MAP: Record<string, "SCHEDULED" | "LIVE" | "FINISHED" | "POSTPONED" | "CANCELLED"> = {
  TBD: "SCHEDULED",
  NS: "SCHEDULED",
  "1H": "LIVE",
  HT: "LIVE",
  "2H": "LIVE",
  ET: "LIVE",
  BT: "LIVE",
  P: "LIVE",
  LIVE: "LIVE",
  INT: "LIVE",
  SUSP: "LIVE",
  FT: "FINISHED",
  AET: "FINISHED",
  PEN: "FINISHED",
  AWD: "FINISHED",
  WO: "FINISHED",
  PST: "POSTPONED",
  CANC: "CANCELLED",
  ABD: "CANCELLED",
};

function parseJornadaNumber(round: string): number {
  const match = round.match(/(\d+)\s*$/);
  return match ? Number(match[1]) : 0;
}

async function upsertTeam(apiTeam: { id: number; name: string }) {
  const externalId = String(apiTeam.id);

  const byExternalId = await prisma.team.findUnique({ where: { externalId } });
  if (byExternalId) return byExternalId;

  // Link up a team we already seeded by name, without touching its
  // badgeSeed so the generated crest stays visually stable.
  const byName = await prisma.team.findUnique({ where: { name: apiTeam.name } });
  if (byName) {
    return prisma.team.update({ where: { id: byName.id }, data: { externalId } });
  }

  return prisma.team.create({
    data: { name: apiTeam.name, externalId, badgeSeed: apiTeam.name },
  });
}

export async function syncFixtures() {
  const leagueId = process.env.API_FOOTBALL_LEAGUE_ID;
  const season = process.env.API_FOOTBALL_SEASON_YEAR;
  if (!leagueId || !season) {
    throw new Error("Falta configurar API_FOOTBALL_LEAGUE_ID / API_FOOTBALL_SEASON_YEAR.");
  }

  const seasonRow = await prisma.season.upsert({
    where: { externalId: `${leagueId}-${season}` },
    update: {},
    create: {
      name: `Liga BetPlay ${season}`,
      externalId: `${leagueId}-${season}`,
      isActive: true,
    },
  });

  const data = await fetchApiFootball("fixtures", { league: leagueId, season });
  const fixtures = data.response as ApiFixture[];

  let created = 0;
  let updated = 0;
  let skippedManual = 0;

  for (const f of fixtures) {
    const homeTeam = await upsertTeam(f.teams.home);
    const awayTeam = await upsertTeam(f.teams.away);
    const jornadaNumber = parseJornadaNumber(f.league.round);

    const jornada = await prisma.jornada.upsert({
      where: { seasonId_number: { seasonId: seasonRow.id, number: jornadaNumber } },
      update: {},
      create: { seasonId: seasonRow.id, number: jornadaNumber, label: f.league.round },
    });

    const externalFixtureId = String(f.fixture.id);
    const status = STATUS_MAP[f.fixture.status.short] ?? "SCHEDULED";
    const existing = await prisma.match.findUnique({ where: { externalFixtureId } });

    const baseData = {
      jornadaId: jornada.id,
      homeTeamId: homeTeam.id,
      awayTeamId: awayTeam.id,
      kickoff: new Date(f.fixture.date),
      lastSyncedAt: new Date(),
    };

    if (existing?.resultSource === "MANUAL") {
      // Never clobber an admin's manual correction — only keep scheduling
      // metadata (kickoff/jornada) in sync in case of a reschedule.
      await prisma.match.update({
        where: { id: existing.id },
        data: {
          kickoff: baseData.kickoff,
          jornadaId: baseData.jornadaId,
          lastSyncedAt: baseData.lastSyncedAt,
        },
      });
      skippedManual++;
      continue;
    }

    const scoreData =
      status === "FINISHED" && f.goals.home != null && f.goals.away != null
        ? { homeScore: f.goals.home, awayScore: f.goals.away, resultSource: "API" as const }
        : {};

    if (existing) {
      await prisma.match.update({
        where: { id: existing.id },
        data: { ...baseData, status, ...scoreData },
      });
      updated++;
    } else {
      await prisma.match.create({
        data: { ...baseData, externalFixtureId, status, ...scoreData },
      });
      created++;
    }
  }

  return { created, updated, skippedManual, total: fixtures.length };
}
