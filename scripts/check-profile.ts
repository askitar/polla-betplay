import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  const user = await prisma.user.findUnique({ where: { email: "tester@example.com" } });
  console.log(JSON.stringify({ name: user?.name, imageLength: user?.image?.length, imagePrefix: user?.image?.slice(0, 30) }, null, 2));
}

main().finally(() => prisma.$disconnect());
