import test from "node:test";
import assert from "node:assert/strict";
import { computePollaProgress, isRegularSeasonRound, officialResultWins, type ProgressMatch } from "./season";

const kickoff = new Date("2026-11-12T21:00:00Z");

// A season shaped as { fecha: [finished, live, scheduled, postponed] }.
function season(shape: Record<number, [number, number, number, number]>): ProgressMatch[] {
  const out: ProgressMatch[] = [];
  for (const [fecha, [f, l, s, p]] of Object.entries(shape)) {
    const add = (n: number, status: string) => {
      for (let i = 0; i < n; i++) out.push({ jornadaNumber: Number(fecha), status, kickoff });
    };
    add(f, "FINISHED");
    add(l, "LIVE");
    add(s, "SCHEDULED");
    add(p, "POSTPONED");
  }
  return out;
}

test("only regular-season Clausura rounds count", () => {
  assert.equal(isRegularSeasonRound("Clausura - 1"), true);
  assert.equal(isRegularSeasonRound("Clausura - 19"), true);
  for (const r of [
    "Clausura - Quarter-finals",
    "Clausura - Semi-finals",
    "Clausura - Final",
    "Clausura",
    "Apertura - 3",
    "Regular Season",
    "",
    null,
    undefined,
  ]) {
    assert.equal(isRegularSeasonRound(r), false, String(r));
  }
});

test("a manual score only gives way to an official final result", () => {
  assert.equal(officialResultWins("FINISHED", 1), true);
  assert.equal(officialResultWins("FINISHED", 0), true);
  assert.equal(officialResultWins("FINISHED", null), false);
  for (const s of ["SCHEDULED", "LIVE", "POSTPONED", "CANCELLED"]) {
    assert.equal(officialResultWins(s, 1), false, s);
  }
});

test("before anything is played it is fecha 1", () => {
  const p = computePollaProgress(season({ 1: [0, 0, 10, 0], 2: [0, 0, 10, 0] }));
  assert.equal(p.currentFecha, 1);
  assert.equal(p.remaining, 20);
  assert.equal(p.isOver, false);
});

test("a game brought forward does not jump the fecha (F17 played during F13)", () => {
  const p = computePollaProgress(season({ 13: [5, 0, 5, 0], 14: [0, 0, 10, 0], 17: [1, 0, 9, 0] }));
  assert.equal(p.currentFecha, 13);
});

test("a game left behind does not hold the fecha back (F13 pending during F14)", () => {
  const p = computePollaProgress(season({ 13: [9, 0, 1, 0], 14: [5, 0, 5, 0], 15: [0, 0, 10, 0] }));
  assert.equal(p.currentFecha, 14);
});

test("stays on a fecha until its games are played, then moves on", () => {
  assert.equal(computePollaProgress(season({ 18: [6, 0, 4, 0], 19: [0, 0, 10, 0] })).currentFecha, 18);
  assert.equal(computePollaProgress(season({ 18: [10, 0, 0, 0], 19: [0, 0, 10, 0] })).currentFecha, 19);
});

test("postponed games do not hold the fecha back", () => {
  const p = computePollaProgress(season({ 4: [8, 0, 0, 2], 5: [0, 0, 0, 10], 6: [6, 0, 4, 0] }));
  assert.equal(p.currentFecha, 6);
  assert.equal(p.postponed, 12);
  assert.equal(p.remaining, 16);
});

test("today's real state: fecha 18 of 19 with 20 left", () => {
  const shape: Record<number, [number, number, number, number]> = {};
  for (let i = 1; i <= 17; i++) shape[i] = [10, 0, 0, 0];
  shape[18] = [0, 0, 10, 0];
  shape[19] = [0, 0, 10, 0];
  const p = computePollaProgress(season(shape));
  assert.deepEqual(
    [p.currentFecha, p.totalFechas, p.remaining, p.finished, p.totalMatches],
    [18, 19, 20, 170, 190],
  );
});

test("a live match still counts as remaining", () => {
  const p = computePollaProgress(season({ 19: [9, 1, 0, 0] }));
  assert.equal(p.remaining, 1);
  assert.equal(p.live, 1);
  assert.equal(p.isOver, false);
});

test("over only when nothing is pending; a pending postponed match keeps it open", () => {
  assert.equal(computePollaProgress(season({ 19: [10, 0, 0, 0] })).isOver, true);
  const open = computePollaProgress(season({ 19: [9, 0, 0, 1] }));
  assert.equal(open.isOver, false);
  assert.equal(open.currentFecha, 19);
  assert.equal(open.lastKickoff, null);
});

test("a cancelled match never holds the pool open", () => {
  const p = computePollaProgress([
    ...season({ 19: [9, 0, 0, 0] }),
    { jornadaNumber: 19, status: "CANCELLED", kickoff },
  ]);
  assert.equal(p.isOver, true);
  assert.equal(p.totalMatches, 9);
});
