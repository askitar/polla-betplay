import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: "tester@example.com" },
    include: { favoriteTeam: true },
  });
  console.log(JSON.stringify({ name: user?.name, favoriteTeam: user?.favoriteTeam?.name }, null, 2));
}

main().finally(() => prisma.$disconnect());
