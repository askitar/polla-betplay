import { NextResponse } from "next/server";
import { Receiver } from "@upstash/qstash";
import { prisma } from "@/lib/prisma";
import { syncHighlightlyToday, checkPostponedMatches } from "@/lib/highlightly";
import { COLOMBIA_OFFSET_MS } from "@/lib/match-time";

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
  // NOTE: this is relative to each match's kickoff, not to "now" — a
  // match that kicked off 45 minutes ago has kickoff = now - 45min, so
  // the lookback bound must be the larger (130min) one and the
  // lookahead bound the smaller (10min) one, or a match past its first
  // 10 live minutes silently falls out of the window forever (it's
  // then neither "LIVE" in our DB, since we never caught it, nor
  // within a mis-shaped window) — this was previously backwards.
  const windowStart = new Date(now.getTime() - 130 * 60_000);
  const windowEnd = new Date(now.getTime() + 10 * 60_000);

  const hasRelevantMatch = await prisma.match.count({
    where: {
      OR: [
        { status: "LIVE" },
        { status: "SCHEDULED", kickoff: { gte: windowStart, lte: windowEnd } },
      ],
    },
  });

  // Postponed matches have no kickoff to compare against "now", so they'd
  // never trip the window guard above — checked separately, once a day
  // (colombia 08:00, the first of the day's 6-min ticks), one Highlightly
  // call per postponed match instead of on every tick.
  const colombiaNow = new Date(now.getTime() + COLOMBIA_OFFSET_MS);
  const isDailyPostponedCheckWindow =
    colombiaNow.getUTCHours() === 8 && colombiaNow.getUTCMinutes() < 6;

  if (hasRelevantMatch === 0 && !isDailyPostponedCheckWindow) {
    return NextResponse.json({ skipped: true, reason: "No hay partidos en vivo ni cerca de su horario." });
  }

  try {
    const sync = hasRelevantMatch > 0 ? await syncHighlightlyToday(now) : { skipped: true };
    const postponedCheck = isDailyPostponedCheckWindow ? await checkPostponedMatches() : { skipped: true };
    return NextResponse.json({ sync, postponedCheck });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error desconocido." },
      { status: 500 },
    );
  }
}
