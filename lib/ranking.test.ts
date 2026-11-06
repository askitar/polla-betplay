import test from "node:test";
import assert from "node:assert/strict";
import { rankEntries } from "./ranking";

const player = (name: string, points: number, exact = 0, winners = 0, goals = 0, uniques = 0) => ({
  name,
  points,
  exact,
  winners,
  goals,
  uniques,
});
const order = (entries: ReturnType<typeof player>[]) =>
  rankEntries(entries).map((e) => `${e.rank}:${e.name}`);

test("more points wins", () => {
  assert.deepEqual(order([player("a", 10), player("b", 20)]), ["1:b", "2:a"]);
});

test("tiebreaks apply in the published order", () => {
  assert.deepEqual(order([player("a", 20, 1, 9, 9, 9), player("b", 20, 2)]), ["1:b", "2:a"]);
  assert.deepEqual(order([player("a", 20, 1, 1, 9, 9), player("b", 20, 1, 2)]), ["1:b", "2:a"]);
  assert.deepEqual(order([player("a", 20, 1, 1, 1, 9), player("b", 20, 1, 1, 2)]), ["1:b", "2:a"]);
  assert.deepEqual(order([player("a", 20, 1, 1, 1, 1), player("b", 20, 1, 1, 1, 2)]), ["1:b", "2:a"]);
});

test("still level after every tiebreak means sharing the position", () => {
  const ranks = rankEntries([player("a", 30), player("b", 20), player("c", 20), player("d", 10)]).map(
    (e) => e.rank,
  );
  assert.deepEqual(ranks, [1, 2, 2, 4]);
});
