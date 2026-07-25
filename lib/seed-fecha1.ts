import { prisma } from "@/lib/prisma";

export const TEAM_NAMES = [
  "Llaneros",
  "Deportivo Pereira",
  "Deportivo Cali",
  "Jaguares",
  "Boyacá Chicó",
  "Atlético Nacional",
  "Independiente Medellín",
  "Deportivo Pasto",
  "Millonarios",
  "Atlético Bucaramanga",
  "Deportes Tolima",
  "Junior",
  "Internacional de Bogotá",
  "América de Cali",
  "Águilas Doradas",
  "Independiente Santa Fe",
  "Alianza FC",
  "Fortaleza",
  "Once Caldas",
  "Cúcuta Deportivo",
];

// Real Liga BetPlay 2026-II, Fecha 1 (confirmed via prensa deportiva:
// El Universal, Infobae, El Espectador, WinSports, Kienyke — jul 2026).
// Times are Colombia local time (UTC-05:00).
const FECHA_1: Array<[string, string, string]> = [
  ["Llaneros", "Deportivo Pereira", "2026-07-24T18:10:00-05:00"],
  ["Deportivo Cali", "Jaguares", "2026-07-24T20:15:00-05:00"],
  ["Boyacá Chicó", "Atlético Nacional", "2026-07-25T14:00:00-05:00"],
  ["Independiente Medellín", "Deportivo Pasto", "2026-07-25T16:05:00-05:00"],
  ["Millonarios", "Atlético Bucaramanga", "2026-07-25T18:10:00-05:00"],
  ["Deportes Tolima", "Junior", "2026-07-25T20:15:00-05:00"],
  ["Internacional de Bogotá", "América de Cali", "2026-07-26T14:00:00-05:00"],
  ["Águilas Doradas", "Independiente Santa Fe", "2026-07-26T16:05:00-05:00"],
  ["Alianza FC", "Fortaleza", "2026-07-26T18:10:00-05:00"],
  ["Once Caldas", "Cúcuta Deportivo", "2026-07-26T20:15:00-05:00"],
];

/**
 * Upsert-only, safe to re-run: never deletes existing matches/predictions.
 * Used both by the local prisma/seed.ts script and the one-time production
 * seed route.
 */
export async function seedFecha1() {
  const teams: Record<string, { id: string }> = {};
  for (const name of TEAM_NAMES) {
    const team = await prisma.team.upsert({
      where: { name },
      update: {},
      create: { name, badgeSeed: name },
    });
    teams[name] = team;
  }

  const season = await prisma.season.upsert({
    where: { externalId: "manual-2026-II" },
    update: { name: "Liga BetPlay 2026-II", isActive: true },
    create: { name: "Liga BetPlay 2026-II", externalId: "manual-2026-II", isActive: true },
  });

  const jornada1 = await prisma.jornada.upsert({
    where: { seasonId_number: { seasonId: season.id, number: 1 } },
    update: {},
    create: { seasonId: season.id, number: 1, label: "Fecha 1" },
  });

  for (const [home, away, kickoffIso] of FECHA_1) {
    const externalFixtureId = `betplay-2026ii-f1-${home}-${away}`;
    await prisma.match.upsert({
      where: { externalFixtureId },
      // Never touch an existing row: admin corrections (postponements,
      // rescheduled kickoffs, results) must survive a re-run of this seed.
      update: {},
      create: {
        jornadaId: jornada1.id,
        homeTeamId: teams[home].id,
        awayTeamId: teams[away].id,
        kickoff: new Date(kickoffIso),
        status: "SCHEDULED",
        externalFixtureId,
      },
    });
  }

  return { teams: TEAM_NAMES.length, season: season.name, matches: FECHA_1.length };
}
