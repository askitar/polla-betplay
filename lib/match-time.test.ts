import test from "node:test";
import assert from "node:assert/strict";
import { canHaveFinalResult, colombiaDateKey, isLocked, isSameColombiaDay } from "./match-time";

const kickoff = new Date("2026-11-07T01:15:00Z"); // Fri Nov 6, 8:15 p. m. in Colombia
const min = (n: number) => new Date(kickoff.getTime() + n * 60_000);

test("predictions lock exactly 10 minutes before kickoff", () => {
  assert.equal(isLocked(kickoff, min(-11)), false);
  assert.equal(isLocked(kickoff, min(-10)), true);
});

test("no final result before 100 minutes after kickoff", () => {
  assert.equal(canHaveFinalResult(kickoff, min(-60 * 24 * 30)), false);
  assert.equal(canHaveFinalResult(kickoff, min(99)), false);
  assert.equal(canHaveFinalResult(kickoff, min(100)), true);
});

test("the day boundary is Colombia's, not UTC's", () => {
  assert.equal(colombiaDateKey(kickoff), "2026-11-06");
  assert.equal(isSameColombiaDay(kickoff, new Date("2026-11-06T15:00:00Z")), true);
  assert.equal(isSameColombiaDay(kickoff, new Date("2026-11-07T15:00:00Z")), false);
});
