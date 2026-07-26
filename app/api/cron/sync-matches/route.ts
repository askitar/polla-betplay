import { NextResponse } from "next/server";
import { Receiver } from "@upstash/qstash";
import { prisma } from "@/lib/prisma";
import { syncHighlightlyToday } from "@/lib/highlightly";

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
  // A match takes roughly 100-130 minutes kickoff to final whistle
  // (90 + stoppage + halftime). Only call out to Highlightly (100
  // requests/day on the free plan) while a match is plausibly in that
  // window or already marked LIVE — everything else is a free no-op.
  const windowStart = new Date(now.getTime() - 10 * 60_000);
  const windowEnd = new Date(now.getTime() + 130 * 60_000);

  const hasRelevantMatch = await prisma.match.count({
    where: {
      OR: [
        { status: "LIVE" },
        { status: "SCHEDULED", kickoff: { gte: windowStart, lte: windowEnd } },
      ],
    },
  });

  if (hasRelevantMatch === 0) {
    return NextResponse.json({ skipped: true, reason: "No hay partidos en vivo ni cerca de su horario." });
  }

  try {
    const result = await syncHighlightlyToday(now);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error desconocido." },
      { status: 500 },
    );
  }
}
