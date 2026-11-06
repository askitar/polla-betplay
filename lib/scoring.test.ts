import test from "node:test";
import assert from "node:assert/strict";
import { computeClubMatchBreakdown, computePoints } from "./scoring";

const r = (homeScore: number, awayScore: number) => ({ homeScore, awayScore });

test("each scoring tier matches the published rules", () => {
  assert.equal(computePoints(r(2, 1), r(2, 1)), 5, "exact");
  assert.equal(computePoints(r(3, 0), r(2, 1)), 2, "winner only");
  assert.equal(computePoints(r(2, 0), r(2, 1)), 3, "winner and one goal count");
  assert.equal(computePoints(r(2, 3), r(2, 1)), 1, "one goal count only");
  assert.equal(computePoints(r(0, 3), r(2, 1)), 0, "nothing");
  assert.equal(computePoints(r(1, 1), r(2, 2)), 2, "draw called, wrong score");
  assert.equal(computePoints(null, r(2, 1)), null, "no prediction");
});

test("unique bonus only when exactly one member nails the score", () => {
  const solo = computeClubMatchBreakdown(r(2, 1), [
    { userId: "a", prediction: r(2, 1) },
    { userId: "b", prediction: r(0, 0) },
    { userId: "c", prediction: null },
  ]);
  assert.equal(solo.get("a")!.total, 7);
  assert.equal(solo.get("a")!.uniqueBonus, true);
  assert.equal(solo.get("c")!.total, 0);

  const shared = computeClubMatchBreakdown(r(2, 1), [
    { userId: "a", prediction: r(2, 1) },
    { userId: "b", prediction: r(2, 1) },
  ]);
  assert.equal(shared.get("a")!.total, 5);
  assert.equal(shared.get("b")!.uniqueBonus, false);
});
