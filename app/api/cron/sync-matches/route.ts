import { NextResponse } from "next/server";
import { Receiver } from "@upstash/qstash";
import { syncHighlightlyToday, reconcileSeason, syncPlayoffs } from "@/lib/highlightly";
import { COLOMBIA_OFFSET_MS } from "@/lib/match-time";
import { activeFixtureDates, isInCronWindow, isReconcileTick } from "@/lib/sync-window";
import { getPendingKickoffs, refreshLiveWindows } from "@/lib/live-window";
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

export async function POST(request: Request) {
  const body = await request.text();

  if (!(await isAuthorized(request, body))) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  // Manual escape hatch to verify the alert email itself works, without
  // waiting for (or faking) a real Highlightly failure.
  if (body) {
    try {
      const { testAlert, reconcile, playoffs } = JSON.parse(body) as {
        testAlert?: boolean;
        reconcile?: boolean;
        playoffs?: boolean;
      };
      // Manual trigger for the full-season reconciliation, so the calendar
      // can be re-squared on demand instead of waiting for tomorrow's run.
      if (playoffs) {
        return NextResponse.json({ playoffs: await syncPlayoffs() });
      }
      if (reconcile) {
        return NextResponse.json({ reconcile: await reconcileSeason() });
      }
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

  // QStash calls this every 5 minutes. Nothing happens outside 4pm to
  // 00:59 Colombia: every match of the cuadrangulares is played in the evening.
  if (!isInCronWindow(hour)) {
    return NextResponse.json({ skipped: true, reason: "Fuera del horario (4pm a 1am Colombia)." });
  }

  // Once a day, on the first tick of the window, the WHOLE season is
  // re-squared against Highlightly (see reconcileSeason): kickoff times,
  // statuses and scores, league and cuadrangulares, and new playoff fixtures
  // get created. Doing it at 4pm, right before the evening's matches, means
  // a same-day schedule change is already in before anything kicks off.
  const reconcileTick = isReconcileTick(hour, minute);

  try {
    const reconciliation = reconcileTick ? await reconcileSeason() : { skipped: true };
    if (reconcileTick) refreshLiveWindows();

    // Highlightly is only called while a match can actually be changing:
    // from 5 minutes before its kickoff until it is reported finished (or 4
    // hours have passed). Which matches those are comes from a cached list of
    // pending kickoffs, so idle ticks cost no API call and no database query.
    const dates = activeFixtureDates(await getPendingKickoffs(), now);
    if (dates.length === 0) {
      return NextResponse.json({ sync: { skipped: true, reason: "Ningún partido en juego." }, reconciliation });
    }

    const sync = await syncHighlightlyToday(now, dates);
    // A status, score or kickoff changed: re-read the pending list on the
    // next tick, so a finished match stops costing calls right away.
    if ("updated" in sync && sync.updated > 0) refreshLiveWindows();
    if ("playoffs" in sync && sync.playoffs && (sync.playoffs.updated > 0 || sync.playoffs.created > 0)) {
      refreshLiveWindows();
    }
    return NextResponse.json({ sync, reconciliation, dates });
  } catch (e) {
    // Best-effort: a broken alert email should never mask the real sync
    // error in the response, and it must never throw past this catch.
    //
    // The daily window is also what makes a DATABASE outage reportable:
    // reconcileSeason always issues queries, so if the database is down
    // that throws here, and `dailyWindow` lets the alert go out without
    // needing the (unreachable) database-backed throttle.
    const alert = await notifySyncFailure(e, { dailyWindow: reconcileTick }).catch(
      () => null,
    );
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error desconocido.", alert },
      { status: 500 },
    );
  }
}
