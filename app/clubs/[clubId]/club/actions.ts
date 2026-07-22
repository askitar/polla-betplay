"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function deleteClubAction(clubId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado.");

  const membership = await prisma.membership.findUnique({
    where: { userId_clubId: { userId: session.user.id, clubId } },
  });
  if (!membership || membership.role !== "ADMIN") {
    throw new Error("Solo un admin del club puede eliminarlo.");
  }

  // Memberships cascade-delete with the club. Predictions are untouched —
  // they belong to the user globally, not to this club.
  await prisma.club.delete({ where: { id: clubId } });
  redirect("/clubs");
}
