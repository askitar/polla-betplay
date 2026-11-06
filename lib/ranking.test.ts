import test from "node:test";
import assert from "node:assert/strict";
import { rankEntries } from "./ranking";

const player = (userName: string, points: number, exact = 0) => ({ userName, points, exact });
const ranks = (entries: ReturnType<typeof player>[]) => rankEntries(entries).map((e) => e.rank);

test("more points goes first", () => {
  const ranked = rankEntries([player("a", 10), player("b", 20)]);
  assert.deepEqual(ranked.map((e) => `${e.rank}:${e.userName}`), ["1:b", "2:a"]);
});

test("two tied for first, next is third", () => {
  assert.deepEqual(ranks([player("a", 30), player("b", 30), player("c", 20)]), [1, 1, 3]);
});

test("one first, two tied for second, next is fourth", () => {
  assert.deepEqual(ranks([player("a", 30), player("b", 20), player("c", 20), player("d", 10)]), [1, 2, 2, 4]);
});

test("exact scores never break a tie on points", () => {
  assert.deepEqual(ranks([player("a", 20, 9), player("b", 20, 0)]), [1, 1]);
});
