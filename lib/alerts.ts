import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import {
  syncFailureEmailHtml,
  syncFailureEmailText,
  stuckMatchEmailHtml,
  stuckMatchEmailText,
  manualMismatchEmailHtml,
  manualMismatchEmailText,
  type StuckMatchRow,
  type ManualMismatchRow,
} from "@/lib/email-templates";

const resend = new Resend(process.env.RESEND_API_KEY);

// Solo-maintainer app — this is Oscar's own address, not a third-party
// destination. Overridable via env without needing a code change.
const OPS_ALERT_EMAIL = process.env.ALERT_EMAIL ?? "osibozo@gmail.com";

// Highlightly's daily quota resets at UTC midnight (confirmed empirically),
// which is always 7:00 p. m. Colombia time (UTC-5, no DST).
const QUOTA_RESET_LABEL_COLOMBIA = "7:00 p. m.";

const KIND_QUOTA = "highlightly_quota_exhausted";
const KIND_DB = "database_unavailable";
const KIND_OTHER = "sync_error";
const KIND_STUCK_MATCH = "stuck_live_match";
const KIND_MANUAL_MISMATCH = "manual_score_mismatch";

export function isQuotaExhaustedError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("429") || message.toLowerCase().includes("breached your daily request limits");
}

/**
 * The database itself being unreachable or over its plan limits — as
 * opposed to a normal query error. This is the outage that takes the whole
 * site down (sessions live in the database, so nobody can even log in), and
 * it's specifically the case where the throttle below CANNOT use the
 * database to remember whether it already alerted.
 */
export function isDatabaseUnavailableError(error: unknown): boolean {
  const message = (error instanceof Error ? error.message : String(error)).toLowerCase();
  return (
    message.includes("compute time quota") ||
    message.includes("53000") ||
    message.includes("p1001") ||
    message.includes("p1002") ||
    message.includes("p2024") ||
    message.includes("can't reach database") ||
    message.includes("connection refused") ||
    message.includes("econnrefused") ||
    message.includes("too many connections")
  );
}

export type NotifyOptions = {
  /**
   * Set by callers that only run once a day (the daily maintenance window),
   * so a database-outage alert can be sent even though the database-backed
   * throttle is unusable — the once-a-day call site IS the throttle.
   * Without this, a database outage stays silent rather than emailing on
   * every failed tick.
   */
  dailyWindow?: boolean;
};

/**
 * Emails Oscar when the automatic sync breaks, at most once per kind per
 * day. Two throttling paths, because the failure mode decides which one can
 * work at all:
 *
 * - Database reachable (e.g. Highlightly quota exhausted): a SystemAlert row
 *   records that we alerted today, so the ~34 ticks that follow stay quiet.
 * - Database unreachable: there is nowhere to record anything, so the alert
 *   only goes out from the once-daily maintenance window, which bounds it
 *   to one email a day by construction.
 *
 * Never throws — alerting must not mask or replace the underlying error.
 */
export async function notifySyncFailure(error: unknown, opts: NotifyOptions = {}) {
  const message = error instanceof Error ? error.message : String(error);
  const isQuota = isQuotaExhaustedError(error);
  const isDbDown = isDatabaseUnavailableError(error);
  const kind = isDbDown ? KIND_DB : isQuota ? KIND_QUOTA : KIND_OTHER;

  if (isDbDown) {
    if (!opts.dailyWindow) {
      return { skipped: true, reason: "Base de datos caída; se avisa en la ventana diaria." };
    }
  } else {
    const startOfUtcDay = new Date();
    startOfUtcDay.setUTCHours(0, 0, 0, 0);
    try {
      const alreadySentToday = await prisma.systemAlert.findFirst({
        where: { kind, sentAt: { gte: startOfUtcDay } },
      });
      if (alreadySentToday) return { skipped: true, reason: "Ya se avisó hoy." };
    } catch {
      // Throttle store unreachable: fall back to the daily-window rule so
      // this can't turn into an email every 30 minutes.
      if (!opts.dailyWindow) {
        return { skipped: true, reason: "No se pudo consultar el control de avisos." };
      }
    }
  }

  const params = {
    isQuota,
    isDbDown,
    errorMessage: message,
    resetsAtLabel: QUOTA_RESET_LABEL_COLOMBIA,
  };

  await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: OPS_ALERT_EMAIL,
    subject: isDbDown
      ? "La base de datos no responde — La Polla BetPlay"
      : isQuota
        ? "Se agotó el cupo diario de Highlightly — La Polla BetPlay"
        : "La sincronización automática falló — La Polla BetPlay",
    html: syncFailureEmailHtml(params),
    text: syncFailureEmailText(params),
  });

  // Best-effort bookkeeping: pointless (and impossible) when the database
  // is the thing that's down.
  if (!isDbDown) {
    await prisma.systemAlert.create({ data: { kind } }).catch(() => null);
  }

  return { sent: true, kind };
}

/**
 * Emails Oscar when a match has sat in LIVE status for far longer than any
 * real match plausibly takes (see STUCK_LIVE_THRESHOLD_MS in highlightly.ts).
 * This is deliberately separate from notifySyncFailure: a stuck match is not
 * a thrown error, it's a successful-looking sync that quietly stopped
 * reflecting reality — the exact shape of today's incident, where the tick
 * cadence left a finished match reading LIVE for a stretch of the evening.
 * Once per day per match, same SystemAlert throttle as the other alerts, so
 * a match still stuck tomorrow gets a fresh email rather than permanent
 * silence, but a single stuck evening doesn't spam every tick.
 */
export async function notifyStuckMatches(matches: StuckMatchRow[]) {
  if (matches.length === 0) return { skipped: true, reason: "Nada atascado." };

  const startOfUtcDay = new Date();
  startOfUtcDay.setUTCHours(0, 0, 0, 0);
  const toAlert: StuckMatchRow[] = [];
  for (const m of matches) {
    const kind = `${KIND_STUCK_MATCH}:${m.matchId}`;
    try {
      const alreadySentToday = await prisma.systemAlert.findFirst({
        where: { kind, sentAt: { gte: startOfUtcDay } },
      });
      if (!alreadySentToday) toAlert.push(m);
    } catch {
      // Throttle store unreachable: skip rather than risk a duplicate email
      // per tick — this path only runs when the DB is already reachable
      // (it's called right after a successful DB read), so this is
      // defensive, not the expected case.
      return { skipped: true, reason: "No se pudo consultar el control de avisos." };
    }
  }
  if (toAlert.length === 0) return { skipped: true, reason: "Ya se avisó hoy." };

  await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: OPS_ALERT_EMAIL,
    subject:
      toAlert.length === 1
        ? `Un partido quedó atascado "en vivo" — La Polla BetPlay`
        : `${toAlert.length} partidos quedaron atascados "en vivo" — La Polla BetPlay`,
    html: stuckMatchEmailHtml(toAlert),
    text: stuckMatchEmailText(toAlert),
  });

  await Promise.all(
    toAlert.map((m) =>
      prisma.systemAlert.create({ data: { kind: `${KIND_STUCK_MATCH}:${m.matchId}` } }).catch(() => null),
    ),
  );

  return { sent: true, count: toAlert.length };
}

/**
 * Emails Oscar when an impossible manual result was reverted (a final score on
 * a match that could not have finished yet). Once per day per match, same
 * SystemAlert throttle as the other alerts.
 */
export async function notifyManualMismatches(rows: ManualMismatchRow[]) {
  if (rows.length === 0) return { skipped: true, reason: "Sin diferencias." };

  const startOfUtcDay = new Date();
  startOfUtcDay.setUTCHours(0, 0, 0, 0);
  const toAlert: ManualMismatchRow[] = [];
  for (const m of rows) {
    const kind = `${KIND_MANUAL_MISMATCH}:${m.matchId}`;
    try {
      const alreadySentToday = await prisma.systemAlert.findFirst({
        where: { kind, sentAt: { gte: startOfUtcDay } },
      });
      if (!alreadySentToday) toAlert.push(m);
    } catch {
      return { skipped: true, reason: "No se pudo consultar el control de avisos." };
    }
  }
  if (toAlert.length === 0) return { skipped: true, reason: "Ya se avisó hoy." };

  await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: OPS_ALERT_EMAIL,
    subject:
      "Se cargaron resultados en partidos que no se habían jugado - La Polla BetPlay",
    html: manualMismatchEmailHtml(toAlert),
    text: manualMismatchEmailText(toAlert),
  });

  await Promise.all(
    toAlert.map((m) =>
      prisma.systemAlert
        .create({ data: { kind: `${KIND_MANUAL_MISMATCH}:${m.matchId}` } })
        .catch(() => null),
    ),
  );

  return { sent: true, count: toAlert.length };
}
