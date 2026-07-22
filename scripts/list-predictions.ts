import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  const preds = await prisma.prediction.findMany({
    include: { user: { select: { name: true, email: true } }, match: { include: { homeTeam: true, awayTeam: true } } },
  });
  console.log(JSON.stringify(preds.map(p => ({
    user: p.user.name,
    match: `${p.match.homeTeam.name} vs ${p.match.awayTeam.name}`,
    score: `${p.homeScore}-${p.awayScore}`,
  })), null, 2));
}

main().finally(() => prisma.$disconnect());
