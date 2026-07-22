import "dotenv/config";
import { seedFecha1 } from "../lib/seed-fecha1";
import { prisma } from "../lib/prisma";

async function main() {
  // Wipe any previous match data (test/dummy fixtures from development) —
  // predictions cascade-delete with their match. Local dev only; the
  // production seed route never does this.
  await prisma.match.deleteMany({});

  const result = await seedFecha1();
  console.log("Seed complete:", result);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
