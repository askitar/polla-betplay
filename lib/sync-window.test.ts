import test from "node:test";
import assert from "node:assert/strict";
import { activeFixtureDates, isInCronWindow, isReconcileTick } from "./sync-window";

test("cron only works from 4pm to 00:59 Colombia", () => {
  for (const h of [16, 17, 20, 23, 0]) assert.equal(isInCronWindow(h), true, String(h));
  for (const h of [1, 6, 7, 12, 15]) assert.equal(isInCronWindow(h), false, String(h));
});

test("reconciliation runs once, on the first tick of 4pm", () => {
  assert.equal(isReconcileTick(16, 0), true);
  assert.equal(isReconcileTick(16, 4), true);
  assert.equal(isReconcileTick(16, 5), false);
  assert.equal(isReconcileTick(17, 0), false);
});

// Santa Fe vs Once Caldas: 6:20pm Colombia = 23:20 UTC.
const KICKOFF = "2026-11-25T23:20:00.000Z";
const at = (iso: string) => new Date(iso);

test("no call before the match window opens", () => {
  assert.deepEqual(activeFixtureDates([KICKOFF], at("2026-11-25T23:10:00Z")), []);
});

test("polls from 5 minutes before kickoff", () => {
  assert.deepEqual(activeFixtureDates([KICKOFF], at("2026-11-25T23:15:00Z")), ["2026-11-25"]);
  assert.deepEqual(activeFixtureDates([KICKOFF], at("2026-11-26T01:00:00Z")), ["2026-11-25"]);
});

test("asks for the fixture's own UTC date, even after UTC midnight", () => {
  // 8:30pm Colombia kickoff = 01:30 UTC the next day; and a 6:20pm match
  // still being checked at 7:05pm (00:05 UTC) belongs to the previous date.
  assert.deepEqual(activeFixtureDates(["2026-11-26T01:30:00Z"], at("2026-11-26T02:00:00Z")), ["2026-11-26"]);
  assert.deepEqual(activeFixtureDates([KICKOFF], at("2026-11-26T00:05:00Z")), ["2026-11-25"]);
});

test("gives up 4 hours after kickoff", () => {
  assert.deepEqual(activeFixtureDates([KICKOFF], at("2026-11-26T03:21:00Z")), []);
});

test("two matches at once on different UTC dates need both dates", () => {
  assert.deepEqual(
    activeFixtureDates([KICKOFF, "2026-11-26T01:30:00Z"], at("2026-11-26T01:35:00Z")),
    ["2026-11-25", "2026-11-26"],
  );
});
