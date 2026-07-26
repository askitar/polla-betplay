import { prisma } from "@/lib/prisma";

// Real Liga BetPlay 2026-II Clausura schedule, Fechas 2-19 (Fecha 1 is
// seeded separately in seed-fecha1.ts), sourced from Highlightly
// (league 204173) and cross-checked against the regular-phase span
// (jul 24 - nov 8, Fecha 19 played simultaneously) confirmed by press
// (WinSports/ESPN). A handful of fixtures (one per a few rounds,
// mostly involving Atlético Nacional or Cúcuta Deportivo) still carry
// a placeholder date far outside their round's cluster because Dimayor
// hasn't locked in their kickoff time yet — seeded as-is per Oscar's
// call, to be corrected automatically once the daily sync reaches
// that date.
const FECHAS: Record<number, Array<[string, string, string]>> = {
  2: [
    ["Atlético Bucaramanga", "Llaneros", "2026-07-31T01:00:00.000Z"],
    ["Fortaleza", "Deportivo Pereira", "2026-08-01T01:00:00.000Z"],
    ["Deportivo Pasto", "Águilas Doradas", "2026-08-01T19:00:00.000Z"],
    ["Alianza FC", "Deportes Tolima", "2026-08-01T21:05:00.000Z"],
    ["Independiente Medellín", "Deportivo Cali", "2026-08-01T23:10:00.000Z"],
    ["Junior", "Millonarios", "2026-08-02T01:15:00.000Z"],
    ["Jaguares", "Atlético Nacional", "2026-08-02T20:45:00.000Z"],
    ["América de Cali", "Boyacá Chicó", "2026-08-02T22:45:00.000Z"],
    ["Independiente Santa Fe", "Once Caldas", "2026-08-03T01:00:00.000Z"],
    ["Cúcuta Deportivo", "Internacional de Bogotá", "2026-09-02T23:20:00.000Z"],
  ],
  3: [
    ["Atlético Bucaramanga", "Cúcuta Deportivo", "2026-08-04T01:00:00.000Z"],
    ["Llaneros", "Fortaleza", "2026-08-04T21:10:00.000Z"],
    ["Deportes Tolima", "Independiente Medellín", "2026-08-04T23:15:00.000Z"],
    ["Millonarios", "Deportivo Pasto", "2026-08-05T01:20:00.000Z"],
    ["Internacional de Bogotá", "Jaguares", "2026-08-05T21:20:00.000Z"],
    ["Deportivo Pereira", "Independiente Santa Fe", "2026-08-05T23:25:00.000Z"],
    ["Once Caldas", "América de Cali", "2026-08-06T01:30:00.000Z"],
    ["Boyacá Chicó", "Alianza FC", "2026-08-06T21:00:00.000Z"],
    ["Deportivo Cali", "Águilas Doradas", "2026-08-06T23:05:00.000Z"],
    ["Atlético Nacional", "Junior", "2026-10-01T01:00:00.000Z"],
  ],
  4: [
    ["Fortaleza", "Cúcuta Deportivo", "2026-08-08T21:20:00.000Z"],
    ["Deportes Tolima", "Internacional de Bogotá", "2026-08-08T23:25:00.000Z"],
    ["América de Cali", "Atlético Nacional", "2026-08-09T01:30:00.000Z"],
    ["Independiente Santa Fe", "Boyacá Chicó", "2026-08-09T19:00:00.000Z"],
    ["Águilas Doradas", "Llaneros", "2026-08-09T21:05:00.000Z"],
    ["Jaguares", "Once Caldas", "2026-08-09T23:10:00.000Z"],
    ["Deportivo Pasto", "Deportivo Cali", "2026-08-10T01:15:00.000Z"],
    ["Alianza FC", "Atlético Bucaramanga", "2026-08-10T23:00:00.000Z"],
    ["Junior", "Deportivo Pereira", "2026-08-11T01:05:00.000Z"],
    ["Independiente Medellín", "Millonarios", "2026-08-12T01:00:00.000Z"],
  ],
  5: [
    ["Llaneros", "Deportes Tolima", "2026-08-14T23:00:00.000Z"],
    ["Cúcuta Deportivo", "Águilas Doradas", "2026-08-15T23:05:00.000Z"],
    ["Atlético Nacional", "Independiente Santa Fe", "2026-08-16T01:10:00.000Z"],
    ["Deportivo Pereira", "Jaguares", "2026-08-16T21:00:00.000Z"],
    ["América de Cali", "Fortaleza", "2026-08-16T23:05:00.000Z"],
    ["Once Caldas", "Alianza FC", "2026-08-17T01:15:00.000Z"],
    ["Internacional de Bogotá", "Independiente Medellín", "2026-08-17T19:00:00.000Z"],
    ["Atlético Bucaramanga", "Deportivo Pasto", "2026-08-17T21:05:00.000Z"],
    ["Millonarios", "Deportivo Cali", "2026-08-17T23:10:00.000Z"],
    ["Boyacá Chicó", "Junior", "2026-08-18T01:15:00.000Z"],
  ],
  6: [
    ["Jaguares", "Boyacá Chicó", "2026-08-21T21:00:00.000Z"],
    ["Águilas Doradas", "Millonarios", "2026-08-22T19:00:00.000Z"],
    ["Deportes Tolima", "Atlético Bucaramanga", "2026-08-22T21:05:00.000Z"],
    ["Independiente Santa Fe", "América de Cali", "2026-08-22T23:10:00.000Z"],
    ["Junior", "Once Caldas", "2026-08-23T01:15:00.000Z"],
    ["Fortaleza", "Atlético Nacional", "2026-08-23T19:00:00.000Z"],
    ["Deportivo Pasto", "Llaneros", "2026-08-23T21:05:00.000Z"],
    ["Deportivo Cali", "Internacional de Bogotá", "2026-08-23T23:10:00.000Z"],
    ["Independiente Medellín", "Cúcuta Deportivo", "2026-08-24T01:15:00.000Z"],
    ["Alianza FC", "Deportivo Pereira", "2026-08-24T23:00:00.000Z"],
  ],
  7: [
    ["Atlético Bucaramanga", "Águilas Doradas", "2026-08-25T23:00:00.000Z"],
    ["Independiente Santa Fe", "Jaguares", "2026-08-26T01:05:00.000Z"],
    ["Boyacá Chicó", "Fortaleza", "2026-08-26T19:00:00.000Z"],
    ["Internacional de Bogotá", "Deportivo Pasto", "2026-08-26T21:20:00.000Z"],
    ["América de Cali", "Junior", "2026-08-26T23:25:00.000Z"],
    ["Atlético Nacional", "Deportivo Cali", "2026-08-27T01:30:00.000Z"],
    ["Llaneros", "Millonarios", "2026-08-27T23:10:00.000Z"],
    ["Once Caldas", "Deportes Tolima", "2026-08-28T01:15:00.000Z"],
    ["Deportivo Pereira", "Independiente Medellín", "2026-09-04T01:00:00.000Z"],
    ["Cúcuta Deportivo", "Alianza FC", "2026-10-08T23:00:00.000Z"],
  ],
  8: [
    ["Jaguares", "América de Cali", "2026-08-29T21:45:00.000Z"],
    ["Junior", "Independiente Santa Fe", "2026-08-29T23:30:00.000Z"],
    ["Alianza FC", "Atlético Nacional", "2026-08-30T01:30:00.000Z"],
    ["Águilas Doradas", "Boyacá Chicó", "2026-08-30T19:00:00.000Z"],
    ["Independiente Medellín", "Llaneros", "2026-08-30T21:10:00.000Z"],
    ["Millonarios", "Internacional de Bogotá", "2026-08-30T23:15:00.000Z"],
    ["Deportes Tolima", "Cúcuta Deportivo", "2026-08-31T01:20:00.000Z"],
    ["Deportivo Pasto", "Deportivo Pereira", "2026-08-31T23:00:00.000Z"],
    ["Deportivo Cali", "Atlético Bucaramanga", "2026-09-01T01:05:00.000Z"],
    ["Fortaleza", "Once Caldas", "2026-09-02T01:00:00.000Z"],
  ],
  9: [
    ["Atlético Bucaramanga", "Independiente Medellín", "2026-09-05T19:00:00.000Z"],
    ["Boyacá Chicó", "Once Caldas", "2026-09-05T21:00:00.000Z"],
    ["América de Cali", "Alianza FC", "2026-09-05T23:15:00.000Z"],
    ["Junior", "Jaguares", "2026-09-06T01:20:00.000Z"],
    ["Internacional de Bogotá", "Águilas Doradas", "2026-09-06T19:00:00.000Z"],
    ["Cúcuta Deportivo", "Deportivo Pasto", "2026-09-06T21:05:00.000Z"],
    ["Deportivo Pereira", "Millonarios", "2026-09-06T23:10:00.000Z"],
    ["Independiente Santa Fe", "Fortaleza", "2026-09-07T01:15:00.000Z"],
    ["Llaneros", "Deportivo Cali", "2026-09-08T01:00:00.000Z"],
    ["Atlético Nacional", "Deportes Tolima", "2026-10-08T01:20:00.000Z"],
  ],
  10: [
    ["Jaguares", "Fortaleza", "2026-09-11T23:15:00.000Z"],
    ["Alianza FC", "Junior", "2026-09-12T01:20:00.000Z"],
    ["Deportivo Pereira", "Atlético Bucaramanga", "2026-09-12T19:00:00.000Z"],
    ["Internacional de Bogotá", "Llaneros", "2026-09-12T21:05:00.000Z"],
    ["Boyacá Chicó", "Independiente Medellín", "2026-09-12T23:10:00.000Z"],
    ["América de Cali", "Deportivo Pasto", "2026-09-13T01:15:00.000Z"],
    ["Independiente Santa Fe", "Deportes Tolima", "2026-09-13T19:00:00.000Z"],
    ["Atlético Nacional", "Águilas Doradas", "2026-09-13T21:05:00.000Z"],
    ["Once Caldas", "Deportivo Cali", "2026-09-13T23:10:00.000Z"],
    ["Cúcuta Deportivo", "Millonarios", "2026-09-14T01:15:00.000Z"],
  ],
  11: [
    ["Águilas Doradas", "Deportivo Pereira", "2026-09-18T21:00:00.000Z"],
    ["Independiente Medellín", "Jaguares", "2026-09-19T01:10:00.000Z"],
    ["Deportivo Pasto", "Once Caldas", "2026-09-19T19:00:00.000Z"],
    ["Alianza FC", "Independiente Santa Fe", "2026-09-19T21:05:00.000Z"],
    ["Deportivo Cali", "Cúcuta Deportivo", "2026-09-19T23:10:00.000Z"],
    ["Millonarios", "Boyacá Chicó", "2026-09-20T01:15:00.000Z"],
    ["Fortaleza", "Junior", "2026-09-20T19:00:00.000Z"],
    ["Atlético Bucaramanga", "Internacional de Bogotá", "2026-09-20T21:05:00.000Z"],
    ["Deportes Tolima", "América de Cali", "2026-09-20T23:10:00.000Z"],
    ["Llaneros", "Atlético Nacional", "2026-09-21T01:15:00.000Z"],
  ],
  12: [
    ["Independiente Santa Fe", "Deportivo Cali", "2026-09-23T01:00:00.000Z"],
    ["América de Cali", "Águilas Doradas", "2026-09-23T23:25:00.000Z"],
    ["Atlético Nacional", "Millonarios", "2026-09-24T01:30:00.000Z"],
    ["Boyacá Chicó", "Deportivo Pasto", "2026-09-25T23:10:00.000Z"],
    ["Once Caldas", "Atlético Bucaramanga", "2026-09-26T01:15:00.000Z"],
    ["Deportivo Pereira", "Internacional de Bogotá", "2026-09-26T21:10:00.000Z"],
    ["Cúcuta Deportivo", "Llaneros", "2026-09-26T23:15:00.000Z"],
    ["Junior", "Independiente Medellín", "2026-09-27T01:20:00.000Z"],
    ["Jaguares", "Alianza FC", "2026-09-27T21:00:00.000Z"],
    ["Fortaleza", "Deportes Tolima", "2026-09-27T23:05:00.000Z"],
  ],
  13: [
    ["Águilas Doradas", "Jaguares", "2026-10-03T19:00:00.000Z"],
    ["Deportivo Cali", "Alianza FC", "2026-10-03T21:05:00.000Z"],
    ["Deportes Tolima", "Boyacá Chicó", "2026-10-03T23:10:00.000Z"],
    ["Independiente Medellín", "Independiente Santa Fe", "2026-10-04T01:15:00.000Z"],
    ["Deportivo Pasto", "Fortaleza", "2026-10-04T19:00:00.000Z"],
    ["Cúcuta Deportivo", "Deportivo Pereira", "2026-10-04T21:05:00.000Z"],
    ["Atlético Bucaramanga", "Junior", "2026-10-04T23:10:00.000Z"],
    ["Llaneros", "América de Cali", "2026-10-05T01:15:00.000Z"],
    ["Millonarios", "Once Caldas", "2026-10-14T01:00:00.000Z"],
    ["Internacional de Bogotá", "Atlético Nacional", "2026-10-17T01:00:00.000Z"],
  ],
  14: [
    ["Fortaleza", "Millonarios", "2026-10-09T01:10:00.000Z"],
    ["Once Caldas", "Llaneros", "2026-10-10T21:05:00.000Z"],
    ["Junior", "Internacional de Bogotá", "2026-10-10T23:10:00.000Z"],
    ["Deportivo Pereira", "Deportivo Cali", "2026-10-11T19:00:00.000Z"],
    ["Atlético Nacional", "Deportivo Pasto", "2026-10-11T21:05:00.000Z"],
    ["Jaguares", "Deportes Tolima", "2026-10-11T23:10:00.000Z"],
    ["América de Cali", "Independiente Medellín", "2026-10-12T01:15:00.000Z"],
    ["Alianza FC", "Águilas Doradas", "2026-10-12T23:05:00.000Z"],
    ["Boyacá Chicó", "Cúcuta Deportivo", "2026-10-13T01:10:00.000Z"],
    ["Independiente Santa Fe", "Atlético Bucaramanga", "2026-10-15T00:00:00.000Z"],
  ],
  15: [
    ["Millonarios", "Jaguares", "2026-10-17T19:00:00.000Z"],
    ["Águilas Doradas", "Deportes Tolima", "2026-10-17T21:05:00.000Z"],
    ["Atlético Bucaramanga", "América de Cali", "2026-10-17T23:10:00.000Z"],
    ["Independiente Medellín", "Once Caldas", "2026-10-18T01:15:00.000Z"],
    ["Llaneros", "Independiente Santa Fe", "2026-10-18T22:45:00.000Z"],
    ["Deportivo Cali", "Junior", "2026-10-19T01:00:00.000Z"],
    ["Deportivo Pereira", "Boyacá Chicó", "2026-10-19T23:00:00.000Z"],
    ["Deportivo Pasto", "Alianza FC", "2026-10-20T01:05:00.000Z"],
    ["Internacional de Bogotá", "Fortaleza", "2026-10-20T23:00:00.000Z"],
    ["Cúcuta Deportivo", "Atlético Nacional", "2026-10-21T01:05:00.000Z"],
  ],
  16: [
    ["Independiente Santa Fe", "Millonarios", "2026-09-03T01:25:00.000Z"],
    ["América de Cali", "Cúcuta Deportivo", "2026-10-24T01:00:00.000Z"],
    ["Boyacá Chicó", "Atlético Bucaramanga", "2026-10-24T19:00:00.000Z"],
    ["Alianza FC", "Internacional de Bogotá", "2026-10-24T21:05:00.000Z"],
    ["Junior", "Águilas Doradas", "2026-10-24T23:10:00.000Z"],
    ["Once Caldas", "Deportivo Pereira", "2026-10-25T00:15:00.000Z"],
    ["Fortaleza", "Deportivo Cali", "2026-10-25T19:00:00.000Z"],
    ["Jaguares", "Llaneros", "2026-10-25T21:05:00.000Z"],
    ["Atlético Nacional", "Independiente Medellín", "2026-10-25T23:10:00.000Z"],
    ["Deportes Tolima", "Deportivo Pasto", "2026-10-26T01:15:00.000Z"],
  ],
  17: [
    ["Millonarios", "América de Cali", "2026-10-27T01:00:00.000Z"],
    ["Águilas Doradas", "Fortaleza", "2026-10-29T21:00:00.000Z"],
    ["Deportivo Pereira", "Deportes Tolima", "2026-10-29T23:15:00.000Z"],
    ["Internacional de Bogotá", "Once Caldas", "2026-10-30T01:20:00.000Z"],
    ["Independiente Medellín", "Alianza FC", "2026-10-30T23:15:00.000Z"],
    ["Deportivo Cali", "Boyacá Chicó", "2026-10-31T01:20:00.000Z"],
    ["Cúcuta Deportivo", "Independiente Santa Fe", "2026-10-31T21:00:00.000Z"],
    ["Llaneros", "Junior", "2026-10-31T23:05:00.000Z"],
    ["Deportivo Pasto", "Jaguares", "2026-11-01T01:10:00.000Z"],
    ["Atlético Bucaramanga", "Atlético Nacional", "2026-11-01T23:10:00.000Z"],
  ],
  18: [
    ["Fortaleza", "Independiente Medellín", "2026-11-02T21:20:00.000Z"],
    ["Once Caldas", "Águilas Doradas", "2026-11-02T23:25:00.000Z"],
    ["Deportes Tolima", "Millonarios", "2026-11-03T01:30:00.000Z"],
    ["Alianza FC", "Llaneros", "2026-11-03T21:10:00.000Z"],
    ["Independiente Santa Fe", "Deportivo Pasto", "2026-11-03T23:15:00.000Z"],
    ["América de Cali", "Deportivo Cali", "2026-11-04T01:20:00.000Z"],
    ["Boyacá Chicó", "Internacional de Bogotá", "2026-11-04T19:00:00.000Z"],
    ["Jaguares", "Atlético Bucaramanga", "2026-11-04T21:20:00.000Z"],
    ["Junior", "Cúcuta Deportivo", "2026-11-04T23:25:00.000Z"],
    ["Atlético Nacional", "Deportivo Pereira", "2026-11-05T01:30:00.000Z"],
  ],
  19: [
    ["Deportivo Pasto", "Junior", "2026-11-08T20:30:00.000Z"],
    ["Millonarios", "Alianza FC", "2026-11-08T20:30:00.000Z"],
    ["Deportivo Pereira", "América de Cali", "2026-11-08T20:30:00.000Z"],
    ["Deportivo Cali", "Deportes Tolima", "2026-11-08T20:30:00.000Z"],
    ["Cúcuta Deportivo", "Jaguares", "2026-11-08T20:30:00.000Z"],
    ["Internacional de Bogotá", "Independiente Santa Fe", "2026-11-08T20:30:00.000Z"],
    ["Llaneros", "Boyacá Chicó", "2026-11-08T20:30:00.000Z"],
    ["Atlético Bucaramanga", "Fortaleza", "2026-11-08T20:30:00.000Z"],
    ["Águilas Doradas", "Independiente Medellín", "2026-11-08T20:30:00.000Z"],
    ["Atlético Nacional", "Once Caldas", "2026-11-08T20:30:00.000Z"],
  ],
};

/**
 * Upsert-only, safe to re-run: never touches an existing match's
 * status/kickoff/score (same guarantee as seedFecha1). Assumes every
 * team already exists (seeded by seedFecha1) and the season row
 * already exists.
 */
export async function seedRemainingFechas() {
  const season = await prisma.season.findUnique({ where: { externalId: "manual-2026-II" } });
  if (!season) throw new Error("Corre primero el seed de Fecha 1 (crea la Season).");

  const teams = await prisma.team.findMany({ select: { id: true, name: true } });
  const teamIdByName = new Map(teams.map((t) => [t.name, t.id]));

  let jornadasCreated = 0;
  let matchesCreated = 0;
  let matchesSkipped = 0;

  for (const [fechaStr, fixtures] of Object.entries(FECHAS)) {
    const number = Number(fechaStr);
    const jornada = await prisma.jornada.upsert({
      where: { seasonId_number: { seasonId: season.id, number } },
      update: {},
      create: { seasonId: season.id, number, label: `Fecha ${number}` },
    });
    jornadasCreated++;

    for (const [home, away, kickoffIso] of fixtures) {
      const homeTeamId = teamIdByName.get(home);
      const awayTeamId = teamIdByName.get(away);
      if (!homeTeamId || !awayTeamId) {
        throw new Error(`Equipo no encontrado: ${home} o ${away}`);
      }

      const externalFixtureId = `betplay-2026ii-f${number}-${home}-${away}`;
      const existing = await prisma.match.findUnique({ where: { externalFixtureId } });
      if (existing) {
        matchesSkipped++;
        continue;
      }

      await prisma.match.create({
        data: {
          jornadaId: jornada.id,
          homeTeamId,
          awayTeamId,
          kickoff: new Date(kickoffIso),
          status: "SCHEDULED",
          externalFixtureId,
        },
      });
      matchesCreated++;
    }
  }

  return { jornadasCreated, matchesCreated, matchesSkipped };
}
