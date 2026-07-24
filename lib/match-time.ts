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
const COLOMBIA_OFFSET_MS = -5 * 60 * 60 * 1000;

function colombiaDateKey(d: Date): string {
  return new Date(d.getTime() + COLOMBIA_OFFSET_MS).toISOString().slice(0, 10);
}

export function isSameColombiaDay(a: Date, b: Date): boolean {
  return colombiaDateKey(a) === colombiaDateKey(b);
}
