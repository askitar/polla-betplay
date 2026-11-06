"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isLocked, canHaveFinalResult } from "@/lib/match-time";

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
  // A postponed match has no real kickoff: its stored date is stale and in the
  // past, and predictions stay open on it (the card says so) until it gets a
  // new one. A LIVE match is closed whatever its stored kickoff says.
  const postponed = match.status === "POSTPONED" || match.status === "CANCELLED";
  if (
    match.status === "FINISHED" ||
    match.status === "LIVE" ||
    (!postponed && isLocked(match.kickoff, new Date()))
  ) {
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

  // Same fresh-read rule as savePrediction: never trust a flag computed
  // earlier, check the stored kickoff against server time right now.
  //
  // Without this, an admin could save a "final" result for a match that had
  // not started — and did, repeatedly: the form sits right under the
  // prediction dials, so a prediction typed into the wrong box became the
  // official result for everyone, matches a month away included, and
  // awarded points for games that never happened.
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) throw new Error("Partido no encontrado.");
  if (match.status === "POSTPONED" || match.status === "CANCELLED") {
    throw new Error("Este partido está aplazado, así que no se le puede cargar un resultado final.");
  }
  if (!canHaveFinalResult(match.kickoff, new Date())) {
    throw new Error(
      "Este partido todavía no ha terminado, así que no se le puede cargar un resultado final. " +
        "Si querías poner tu predicción, usa los marcadores de arriba.",
    );
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
