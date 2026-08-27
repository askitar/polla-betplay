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
const KIND_OTHER = "sync_error";

export function isQuotaExhaustedError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("429") || message.toLowerCase().includes("breached your daily request limits");
}

/**
 * Sends at most one "the automatic sync stopped working" email per UTC day
 * (the same window Highlightly's quota resets on) per failure kind — the
 * sync cron ticks every ~30 minutes, so a bad day can fail dozens of times
 * in a row; only the first failure of a given kind that day actually sends
 * anything, everything after is a silent no-op.
 */
export async function notifySyncFailure(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const isQuota = isQuotaExhaustedError(error);
  const kind = isQuota ? KIND_QUOTA : KIND_OTHER;

  const startOfUtcDay = new Date();
  startOfUtcDay.setUTCHours(0, 0, 0, 0);

  const alreadySentToday = await prisma.systemAlert.findFirst({
    where: { kind, sentAt: { gte: startOfUtcDay } },
  });
  if (alreadySentToday) return { skipped: true, reason: "Ya se avisó hoy." };

  const params = { isQuota, errorMessage: message, resetsAtLabel: QUOTA_RESET_LABEL_COLOMBIA };

  await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: OPS_ALERT_EMAIL,
    subject: isQuota
      ? "Se agotó el cupo diario de Highlightly — La Polla BetPlay"
      : "La sincronización automática falló — La Polla BetPlay",
    html: syncFailureEmailHtml(params),
    text: syncFailureEmailText(params),
  });

  await prisma.systemAlert.create({ data: { kind } });
  return { sent: true, kind };
}
