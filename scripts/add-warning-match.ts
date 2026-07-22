import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  const season = await prisma.season.findUnique({ where: { externalId: "seed-2026" } });
  const jornada1 = await prisma.jornada.findUnique({ where: { seasonId_number: { seasonId: season!.id, number: 1 } } });
  const alianza = await prisma.team.findUnique({ where: { name: "Alianza FC" } });
  const fortaleza = await prisma.team.findUnique({ where: { name: "Fortaleza" } });

  const kickoff = new Date(Date.now() + 70 * 60_000); // 70 min from now: inside 2h warning, not locked
  await prisma.match.upsert({
    where: { externalFixtureId: "seed-warning-test" },
    update: { kickoff },
    create: {
      jornadaId: jornada1!.id,
      homeTeamId: alianza!.id,
      awayTeamId: fortaleza!.id,
      kickoff,
      status: "SCHEDULED",
      externalFixtureId: "seed-warning-test",
    },
  });
  console.log("done", kickoff.toISOString());
}

main().finally(() => prisma.$disconnect());
