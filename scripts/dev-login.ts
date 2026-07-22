import "dotenv/config";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  const email = process.argv[2] ?? "tester@example.com";
  const name = process.argv[3] ?? "Tester";

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name, emailVerified: new Date() },
  });

  const sessionToken = randomUUID();
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await prisma.session.create({ data: { sessionToken, userId: user.id, expires } });

  console.log(JSON.stringify({ userId: user.id, email: user.email, sessionToken, expires }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
