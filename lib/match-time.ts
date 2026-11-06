// All lock/reveal decisions must be evaluated against server time. Never
// accept a client-supplied "now" for these checks (see prototype's
// isLocked()/isStarted(), polla-betplay.jsx lines 90-95, ported here to take
// an explicit `now` so server code always passes a freshly-read Date).

const LOCK_WINDOW_MS = 10 * 60_000;
export const WARNING_WINDOW_MS = 2 * 60 * 60_000;

export function isLocked(kickoff: Date, now: Date = new Date()): boolean {
  return now.getTime() >= kickoff.getTime() - LOCK_WINDOW_MS;
}

export function isStarted(kickoff: Date, now: Date = new Date()): boolean {
  return now.getTime() >= kickoff.getTime();
}

export function isWithinWarningWindow(kickoff: Date, now: Date = new Date()): boolean {
  const diff = kickoff.getTime() - now.getTime();
  return diff > 0 && diff <= WARNING_WINDOW_MS;
}

// Colombia has no DST and is always UTC-5, so a fixed offset is enough to
// get the correct civil date in Bogotá regardless of the server's own
// timezone (Vercel runs in UTC).
export const COLOMBIA_OFFSET_MS = -5 * 60 * 60 * 1000;

// Dates must always be formatted with this: server components render in UTC
// on Vercel, so without it an 8:15 p. m. match reads as 01:15 a. m. the next day.
export const COLOMBIA_TIME_ZONE = "America/Bogota";

export function colombiaDateKey(d: Date): string {
  return new Date(d.getTime() + COLOMBIA_OFFSET_MS).toISOString().slice(0, 10);
}

export function isSameColombiaDay(a: Date, b: Date): boolean {
  return colombiaDateKey(a) === colombiaDateKey(b);
}

// The earliest a match can have a real final score: 90 minutes of play plus
// a 15-minute half-time is ~105 minutes after kickoff, so 100 is a slightly
// lenient floor that never blocks a genuine post-whistle correction.
//
// This exists because results were being saved as final for matches that
// had not been played: Fecha 13 and Fecha 17 games, one of them a month
// away, sat as FINISHED with scores like 2-0 and 1-1, awarding real points
// for games that never happened. A final result before this point is not a
// judgment call, it is impossible, so it is refused outright rather than
// left to anyone's care.
export const MIN_FINAL_RESULT_MS = 100 * 60_000;

export function canHaveFinalResult(kickoff: Date, now: Date = new Date()): boolean {
  return now.getTime() >= kickoff.getTime() + MIN_FINAL_RESULT_MS;
}
