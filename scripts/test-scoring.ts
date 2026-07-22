import { computePoints } from "../lib/scoring";

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
