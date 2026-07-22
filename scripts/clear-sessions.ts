import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  const result = await prisma.session.deleteMany({});
  console.log("Deleted sessions:", result.count);
}

main().finally(() => prisma.$disconnect());
