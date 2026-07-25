import { computePoints, computeClubMatchPoints } from "../lib/scoring";

const cases: Array<[string, { homeScore: number; awayScore: number }, { homeScore: number; awayScore: number }, number]> = [
  ["exacto", { homeScore: 2, awayScore: 1 }, { homeScore: 2, awayScore: 1 }, 5],
  ["ganador correcto, marcador distinto", { homeScore: 3, awayScore: 1 }, { homeScore: 2, awayScore: 1 }, 2],
  ["empate acertado, marcador distinto", { homeScore: 0, awayScore: 0 }, { homeScore: 2, awayScore: 2 }, 2],
  ["gol local acertado, resto mal", { homeScore: 2, awayScore: 0 }, { homeScore: 2, awayScore: 3 }, 1],
  ["gol visitante acertado, resto mal", { homeScore: 0, awayScore: 1 }, { homeScore: 3, awayScore: 1 }, 1],
  ["todo mal", { homeScore: 1, awayScore: 0 }, { homeScore: 0, awayScore: 2 }, 0],
];

let allPassed = true;
for (const [label, pred, result, expected] of cases) {
  const got = computePoints(pred, result);
  const ok = got === expected;
  if (!ok) allPassed = false;
  console.log(`${ok ? "OK  " : "FAIL"} ${label}: esperado ${expected}, obtuvo ${got}`);
}
console.log(allPassed ? "\nTodos los casos pasaron." : "\nHay casos fallidos.");

const result = { homeScore: 2, awayScore: 1 };
const clubCases: Array<[string, Array<{ userId: string; prediction: { homeScore: number; awayScore: number } | null }>, Map<string, number>]> = [
  [
    "único con marcador exacto: +2 de bono",
    [
      { userId: "a", prediction: { homeScore: 2, awayScore: 1 } },
      { userId: "b", prediction: { homeScore: 1, awayScore: 0 } },
      { userId: "c", prediction: null },
    ],
    new Map([["a", 7], ["b", 2], ["c", 0]]),
  ],
  [
    "dos con marcador exacto: nadie recibe el bono",
    [
      { userId: "a", prediction: { homeScore: 2, awayScore: 1 } },
      { userId: "b", prediction: { homeScore: 2, awayScore: 1 } },
    ],
    new Map([["a", 5], ["b", 5]]),
  ],
];

for (const [label, memberPredictions, expected] of clubCases) {
  const got = computeClubMatchPoints(result, memberPredictions);
  const ok = memberPredictions.every((m) => got.get(m.userId) === expected.get(m.userId));
  if (!ok) allPassed = false;
  console.log(`${ok ? "OK  " : "FAIL"} ${label}`);
}
console.log(allPassed ? "\nTodos los casos (incluyendo club) pasaron." : "\nHay casos fallidos.");
