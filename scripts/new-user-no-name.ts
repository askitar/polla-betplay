import "dotenv/config";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  const email = "amigo.nuevo@example.com";
  await prisma.session.deleteMany({ where: { user: { email } } });
  await prisma.membership.deleteMany({ where: { user: { email } } });
  await prisma.user.deleteMany({ where: { email } });

  const user = await prisma.user.create({
    data: { email, name: null, emailVerified: new Date() },
  });

  const sessionToken = randomUUID();
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await prisma.session.create({ data: { sessionToken, userId: user.id, expires } });

  console.log(JSON.stringify({ userId: user.id, sessionToken }, null, 2));
}

main().finally(() => prisma.$disconnect());
