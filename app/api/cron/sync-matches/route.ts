import { NextResponse } from "next/server";
import { Receiver } from "@upstash/qstash";
import { prisma } from "@/lib/prisma";
import { syncFixtures } from "@/lib/api-football";

const receiver =
  process.env.QSTASH_CURRENT_SIGNING_KEY && process.env.QSTASH_NEXT_SIGNING_KEY
    ? new Receiver({
        currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY,
        nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY,
      })
    : null;

async function isAuthorized(request: Request, body: string) {
  if (receiver) {
    const signature = request.headers.get("upstash-signature");
    if (!signature) return false;
    return receiver.verify({ signature, body, url: request.url }).catch(() => false);
  }
  // Dev-only fallback while QStash isn't configured yet.
  return request.headers.get("x-cron-secret") === process.env.CRON_SHARED_SECRET;
}

export async function POST(request: Request) {
  const body = await request.text();

  if (!(await isAuthorized(request, body))) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const now = new Date();
  const windowStart = new Date(now.getTime() - 3 * 60 * 60_000);
  const windowEnd = new Date(now.getTime() + 15 * 60_000);

  // Stay well under the free API tier by only calling out when there's
  // actually a match near its kickoff window.
  const hasNearbyMatch = await prisma.match.count({
    where: { kickoff: { gte: windowStart, lte: windowEnd }, status: { not: "FINISHED" } },
  });

  if (hasNearbyMatch === 0) {
    return NextResponse.json({ skipped: true, reason: "No hay partidos cerca de su horario." });
  }

  try {
    const result = await syncFixtures();
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error desconocido." },
      { status: 500 },
    );
  }
}
