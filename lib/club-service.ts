import { prisma } from "@/lib/prisma";
import { generateUniqueClubCode } from "@/lib/invite-code";

export async function createClubForUser(userId: string, name: string) {
  const code = await generateUniqueClubCode();
  return prisma.club.create({
    data: {
      name,
      code,
      createdById: userId,
      memberships: { create: { userId, role: "ADMIN" } },
    },
  });
}

export async function findClubByCode(code: string) {
  return prisma.club.findUnique({
    where: { code: code.trim().toUpperCase() },
    include: { _count: { select: { memberships: true } } },
  });
}

type ClubPreview = NonNullable<Awaited<ReturnType<typeof findClubByCode>>>;

export async function joinClubByCode(
  userId: string,
  code: string,
): Promise<{ error: string; club?: undefined } | { error?: undefined; club: ClubPreview }> {
  const club = await findClubByCode(code);
  if (!club) {
    return { error: "No encontramos un club con ese código." };
  }
  await prisma.membership.upsert({
    where: { userId_clubId: { userId, clubId: club.id } },
    update: {},
    create: { userId, clubId: club.id, role: "MEMBER" },
  });
  return { club };
}
