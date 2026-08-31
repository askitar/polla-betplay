import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { syncFailureEmailHtml, syncFailureEmailText } from "@/lib/email-templates";

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
