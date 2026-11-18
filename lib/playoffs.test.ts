import test from "node:test";
import assert from "node:assert/strict";
import {
  canChangeEntry,
  computePlayoffProgress,
  computeTable,
  inferGroups,
  parsePlayoffRound,
  playoffStageLabel,
} from "./playoffs";

test("recognises cuadrangular rounds and the final, nothing else", () => {
  assert.deepEqual(parsePlayoffRound("Clausura - Quadrangular - 1"), { kind: "group", fecha: 1 });
  assert.deepEqual(parsePlayoffRound("Clausura - Quadrangular - 6"), { kind: "group", fecha: 6 });
  assert.deepEqual(parsePlayoffRound("Clausura - Final"), { kind: "final" });
  for (const r of ["Clausura - 19", "Clausura - Quadrangular - 7", "Apertura - Final", "Apertura - Semi-finals", "", null]) {
    assert.equal(parsePlayoffRound(r), null, String(r));
  }
});

test("stage labels", () => {
  assert.equal(playoffStageLabel(3, "B"), "Grupo B · Fecha 3");
  assert.equal(playoffStageLabel(7, null), "Final · ida");
  assert.equal(playoffStageLabel(8, null), "Final · vuelta");
});

// The real 2026-II draw, from the first two published fechas.
const REAL_PAIRS: Array<[string, string]> = [
  ["Independiente Medellín", "Independiente Santa Fe"],
  ["Atlético Bucaramanga", "América de Cali"],
  ["Deportivo Cali", "Millonarios"],
  ["Once Caldas", "Atlético Nacional"],
  ["Millonarios", "Atlético Bucaramanga"],
  ["América de Cali", "Deportivo Cali"],
  ["Independiente Santa Fe", "Once Caldas"],
  ["Atlético Nacional", "Independiente Medellín"],
];
const LEAGUE_ORDER = [
  "Atlético Nacional",
  "América de Cali",
  "Deportivo Cali",
  "Atlético Bucaramanga",
  "Independiente Santa Fe",
  "Independiente Medellín",
  "Millonarios",
  "Once Caldas",
];

test("groups come out of who plays whom; the league leader heads group A", () => {
  const g = inferGroups(REAL_PAIRS, LEAGUE_ORDER)!;
  assert.ok(g);
  for (const t of ["Atlético Nacional", "Independiente Medellín", "Independiente Santa Fe", "Once Caldas"]) {
    assert.equal(g.get(t), "A", t);
  }
  for (const t of ["América de Cali", "Deportivo Cali", "Atlético Bucaramanga", "Millonarios"]) {
    assert.equal(g.get(t), "B", t);
  }
});

test("no groups until the fixtures connect into exactly two", () => {
  assert.equal(inferGroups(REAL_PAIRS.slice(0, 4), LEAGUE_ORDER), null);
});

test("table: 3/1/0, then goal difference, then goals for; only finished games", () => {
  const t = computeTable(
    ["A", "B", "C", "D"],
    [
      { home: "A", away: "B", homeScore: 2, awayScore: 0, status: "FINISHED" },
      { home: "C", away: "D", homeScore: 1, awayScore: 1, status: "FINISHED" },
      { home: "B", away: "C", homeScore: 3, awayScore: 0, status: "FINISHED" },
      { home: "D", away: "A", homeScore: 5, awayScore: 0, status: "LIVE" },
    ],
  );
  assert.deepEqual(
    t.map((r) => `${r.position}.${r.team} ${r.points}pts ${r.goalDiff}`),
    ["1.A 3pts 2", "2.B 3pts 1", "3.D 1pts 0", "4.C 1pts -3"],
  );
  assert.equal(t.find((r) => r.team === "D")!.played, 1, "the live game does not count yet");
});

test("every group team shows up even before playing", () => {
  const t = computeTable(["A", "B", "C", "D"], []);
  assert.equal(t.length, 4);
  assert.ok(t.every((r) => r.played === 0 && r.points === 0));
});

test("progress counts against the full bracket, not just published fixtures", () => {
  const published = Array.from({ length: 8 }, (_, i) => ({ jornadaNumber: i < 4 ? 1 : 2, status: "SCHEDULED" }));
  const p = computePlayoffProgress(published);
  assert.equal(p.total, 14);
  assert.equal(p.remaining, 14);
  assert.equal(p.label, "Fecha 1 de 6");
  assert.equal(p.isOver, false);
});

test("progress reaches the final and then ends", () => {
  const groups = Array.from({ length: 12 }, (_, i) => ({ jornadaNumber: Math.floor(i / 2) + 1, status: "FINISHED" }));
  assert.equal(
    computePlayoffProgress([...groups, { jornadaNumber: 7, status: "SCHEDULED" }, { jornadaNumber: 8, status: "SCHEDULED" }]).label,
    "Final · ida",
  );
  const done = computePlayoffProgress([
    ...groups,
    { jornadaNumber: 7, status: "FINISHED" },
    { jornadaNumber: 8, status: "FINISHED" },
  ]);
  assert.equal(done.isOver, true);
  assert.equal(done.remaining, 0);
});

test("joining: undecided or no can become yes; yes is final", () => {
  assert.equal(canChangeEntry(null, true), true);
  assert.equal(canChangeEntry(null, false), true);
  assert.equal(canChangeEntry({ accepted: false }, true), true);
  assert.equal(canChangeEntry({ accepted: true }, false), false);
  assert.equal(canChangeEntry({ accepted: true }, true), true);
});
