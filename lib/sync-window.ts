// When the result sync is allowed to spend Highlightly calls. Pure, so it is
// covered by lib/sync-window.test.ts.
//
// The free plan is 100 calls a day, and the cuadrangulares are all played
// in the evening (Colombia), so instead of polling on a fixed cadence all day
// the sync now only calls the API while a match can actually be changing:
// from a few minutes before kickoff until it is reported finished. That buys
// a 5-minute cadence during matches for fewer calls per day than the old
// all-day schedule spent.

/** Colombia hours the cron does anything at all: 4:00pm to 00:59am. */
export const WINDOW_START_HOUR = 16;
export const WINDOW_END_HOUR = 0; // inclusive, past midnight for late finishes

/** Once a day, at the start of the window: the full-season reconciliation. */
export const RECONCILE_HOUR = 16;

/** Start polling this long before kickoff (catches early starts and same-day changes). */
export const PRE_KICKOFF_MS = 5 * 60_000;
/**
 * Stop polling this long after kickoff even if it never reported finished.
 * A real match with extra time and penalties is over well inside 3 hours;
 * past this a match is stuck, the stuck-match alert takes over, and the
 * quota is not burned on it all night.
 */
export const MAX_AFTER_KICKOFF_MS = 4 * 60 * 60_000;

export function isInCronWindow(colombiaHour: number): boolean {
  return colombiaHour >= WINDOW_START_HOUR || colombiaHour <= WINDOW_END_HOUR;
}

export function isReconcileTick(colombiaHour: number, minute: number): boolean {
  return colombiaHour === RECONCILE_HOUR && minute < 5;
}

/**
 * Of the pending matches (SCHEDULED or LIVE), the UTC calendar dates
 * Highlightly must be asked about right now, which is what one API call is
 * keyed by. Empty means no match is in play, so no call is made at all.
 */
export function activeFixtureDates(kickoffs: Array<Date | string>, now: Date): string[] {
  const t = now.getTime();
  const dates = new Set<string>();
  for (const k of kickoffs) {
    const kickoff = new Date(k);
    const ms = kickoff.getTime();
    if (t >= ms - PRE_KICKOFF_MS && t <= ms + MAX_AFTER_KICKOFF_MS) {
      dates.add(kickoff.toISOString().slice(0, 10));
    }
  }
  return [...dates].sort();
}
