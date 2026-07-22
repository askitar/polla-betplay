"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isLocked } from "@/lib/match-time";

export async function savePrediction(
  clubId: string,
  matchId: string,
  homeScore: number,
  awayScore: number,
) {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado.");

  if (
    !Number.isInteger(homeScore) ||
    !Number.isInteger(awayScore) ||
    homeScore < 0 ||
    awayScore < 0
  ) {
    throw new Error("Marcador inválido.");
  }

  // Re-fetch fresh: never trust a lock/started flag computed earlier in the
  // request lifecycle, always check against the current kickoff + server time.
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) throw new Error("Partido no encontrado.");
  if (match.status === "FINISHED" || isLocked(match.kickoff, new Date())) {
    throw new Error("Las predicciones para este partido ya cerraron.");
  }

  await prisma.prediction.upsert({
    where: { userId_matchId: { userId: session.user.id, matchId } },
    update: { homeScore, awayScore },
    create: { userId: session.user.id, matchId, homeScore, awayScore },
  });

  revalidatePath(`/clubs/${clubId}/partidos`);
}

export async function submitManualResult(
  clubId: string,
  matchId: string,
  homeScore: number,
  awayScore: number,
) {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado.");

  const membership = await prisma.membership.findUnique({
    where: { userId_clubId: { userId: session.user.id, clubId } },
  });
  if (!membership || membership.role !== "ADMIN") {
    throw new Error("Solo un admin del club puede cargar resultados.");
  }

  if (
    !Number.isInteger(homeScore) ||
    !Number.isInteger(awayScore) ||
    homeScore < 0 ||
    awayScore < 0
  ) {
    throw new Error("Marcador inválido.");
  }

  // The match is shared across every club, so a correction here fixes it
  // everywhere. MANUAL freezes it against the automatic API sync (task 10).
  await prisma.match.update({
    where: { id: matchId },
    data: { homeScore, awayScore, status: "FINISHED", resultSource: "MANUAL" },
  });

  revalidatePath(`/clubs/${clubId}/partidos`);
  revalidatePath(`/clubs/${clubId}/clasificacion`);
}
