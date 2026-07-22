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
