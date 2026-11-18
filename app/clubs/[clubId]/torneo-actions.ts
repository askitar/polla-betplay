"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PLAYOFF_SEASON_KEY, canChangeEntry } from "@/lib/playoffs";

/**
 * Yes or no to the cuadrangulares pool, per club. "No" can later become
 * "yes"; "yes" is final (Oscar's rule), so leaving is refused here and not
 * just hidden in the UI.
 */
export async function decidePlayoffs(clubId: string, accept: boolean) {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado.");

  const membership = await prisma.membership.findUnique({
    where: { userId_clubId: { userId: session.user.id, clubId } },
  });
  if (!membership) throw new Error("No eres miembro de esta polla.");

  const season = await prisma.season.findUnique({ where: { externalId: PLAYOFF_SEASON_KEY } });
  if (!season) throw new Error("Los cuadrangulares todavía no están abiertos.");

  const key = { userId_clubId_seasonId: { userId: session.user.id, clubId, seasonId: season.id } };
  const current = await prisma.tournamentEntry.findUnique({ where: key });
  if (!canChangeEntry(current, accept)) {
    throw new Error("Ya estás inscrito en los cuadrangulares, la inscripción es definitiva.");
  }
  if (current?.accepted === accept) return;

  await prisma.tournamentEntry.upsert({
    where: key,
    update: { accepted: accept, decidedAt: new Date() },
    create: { userId: session.user.id, clubId, seasonId: season.id, accepted: accept },
  });

  revalidatePath(`/clubs/${clubId}`, "layout");
}
