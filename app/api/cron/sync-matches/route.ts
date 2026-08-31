import { NextResponse } from "next/server";
import { Receiver } from "@upstash/qstash";
import { syncHighlightlyToday, checkPostponedMatches } from "@/lib/highlightly";
import { COLOMBIA_OFFSET_MS } from "@/lib/match-time";
import { notifySyncFailure } from "@/lib/alerts";

const receiver =
  process.env.QSTASH_CURRENT_SIGNING_KEY && process.env.QSTASH_NEXT_SIGNING_KEY
    ? new Receiver({
        currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY,
        nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY,
      })
    : null;

async function isAuthorized(request: Request, body: string) {
  // Shared secret first: lets an admin force a one-off sync check (e.g. to
  // verify a fix immediately) without a real QStash signature.
  if (request.headers.get("x-cron-secret") === process.env.CRON_SHARED_SECRET) return true;
  if (receiver) {
    const signature = request.headers.get("upstash-signature");
    if (!signature) return false;
    return receiver.verify({ signature, body, url: request.url }).catch(() => false);
  }
  return false;
}

// Active window: 7am-11:59pm Colombia. Outside real-world Dimayor kickoff
// hours nothing plausibly changes, so calls are skipped there for free —
// this is just an outer guard, not the thing that decides "is a match
// relevant" (see below for why that used to be the bug).
const ACTIVE_START_HOUR = 7;
const ACTIVE_END_HOUR = 23; // inclusive — the 11pm hour still gets ticks.

export async function POST(request: Request) {
  const body = await request.text();

  if (!(await isAuthorized(request, body))) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  // Manual escape hatch to verify the alert email itself works, without
  // waiting for (or faking) a real Highlightly failure.
  if (body) {
    try {
      const { testAlert } = JSON.parse(body) as { testAlert?: boolean };
      if (testAlert) {
        const result = await notifySyncFailure(
          new Error('Highlightly respondió 429: {"message":"You have breached your daily request limits."}'),
          { dailyWindow: true },
        );
        return NextResponse.json({ testAlert: result });
      }
    } catch {
      // No body / not JSON: proceed as a normal sync tick.
    }
  }

  const now = new Date();
  const colombiaNow = new Date(now.getTime() + COLOMBIA_OFFSET_MS);
  const hour = colombiaNow.getUTCHours();
  const minute = colombiaNow.getUTCMinutes();

  if (hour < ACTIVE_START_HOUR || hour > ACTIVE_END_HOUR) {
    return NextResponse.json({ skipped: true, reason: "Fuera del horario activo (7am-11pm Colombia)." });
  }

  // QStash still ticks this route every 10 minutes around the clock (no
  // schedule change needed) — of those, only every 3rd tick (:00 and :30,
  // give or take a few minutes of delivery jitter) actually spends a
  // Highlightly call. Previously this route only called Highlightly when a
  // match was ALREADY marked LIVE or SCHEDULED within a narrow window of
  // "now" — but that guard trusted our own bookkeeping to already be
  // right, which is exactly what breaks: a match with a wrong stored
  // kickoff time, or one Dimayor postpones same-day hours before it was due
  // to start, both fall outside that window and never get checked again
  // until something else happens to fix them. Calling Highlightly
  // unconditionally on a fixed cadence during the day removes that
  // dependency — every live/suspended/interrupted/postponed/finished
  // transition for TODAY's matches gets picked up within half an hour, no
  // matter what our DB currently believes about them.
  const isSyncTick = minute % 30 < 10;

  // Long-postponed matches (no kickoff to compare against "now" at all,
  // possibly weeks stale) are checked separately, once a day, on the first
  // tick of the active window — one Highlightly call per stale match, so
  // it stays off the every-30-min cadence to keep the daily call budget
  // (100/day on the free plan) comfortable.
  const isDailyPostponedCheckWindow = hour === ACTIVE_START_HOUR && minute < 10;

  if (!isSyncTick && !isDailyPostponedCheckWindow) {
    return NextResponse.json({ skipped: true, reason: "No es un tick de sincronización (cada ~30 min)." });
  }

  try {
    const sync = isSyncTick ? await syncHighlightlyToday(now) : { skipped: true };
    const postponedCheck = isDailyPostponedCheckWindow ? await checkPostponedMatches() : { skipped: true };
    return NextResponse.json({ sync, postponedCheck });
  } catch (e) {
    // Best-effort: a broken alert email should never mask the real sync
    // error in the response, and it must never throw past this catch.
    //
    // The daily window is also what makes a DATABASE outage reportable:
    // checkPostponedMatches always issues a query, so if the database is
    // down that throws here, and `dailyWindow` lets the alert go out
    // without needing the (unreachable) database-backed throttle.
    const alert = await notifySyncFailure(e, { dailyWindow: isDailyPostponedCheckWindow }).catch(
      () => null,
    );
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error desconocido.", alert },
      { status: 500 },
    );
  }
}
