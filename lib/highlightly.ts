import { prisma } from "@/lib/prisma";
import type { ManualMismatchRow } from "@/lib/email-templates";
import { notifyStuckMatches, notifyManualMismatches } from "@/lib/alerts";
import { canHaveFinalResult } from "@/lib/match-time";

const API_BASE = "https://soccer.highlightly.net";

// A real match, extra time and penalties included, is done well inside 2.5
// hours of kickoff. 3 hours is a deliberately generous margin so this never
// fires on a match that is simply still being played — anything past this
// means the transition to FINISHED was missed, whatever the reason (a sync
// gap, Highlightly itself not reporting it, or a matching bug), and today's
// incident (a match still reading LIVE nearly an hour after it had actually
// finished) showed that gap can otherwise go unnoticed until someone happens
// to look at the page.
const STUCK_LIVE_THRESHOLD_MS = 3 * 60 * 60_000;

// Highlightly's team names/spellings don't match ours (different rebrand
// timing, accents, shortenings) — matched by their numeric team id instead,
// confirmed one by one against api/leagues + api/standings for league 204173
// (Colombia Primera A / Liga BetPlay). "Internacional de Bogotá" still shows
// as "La Equidad FC" on Highlightly's side; that's the same club under its
// pre-2026 name (confirmed via press: La Equidad rebranded Dec 2025).
const TEAM_ID_TO_NAME: Record<number, string> = {
  968371: "Atlético Nacional",
  966669: "Junior",
  972626: "Deportes Tolima",
  970073: "Independiente Santa Fe",
  967520: "Once Caldas",
  969222: "América de Cali",
  959010: "Deportivo Pasto",
  959861: "Deportivo Cali",
  965818: "Internacional de Bogotá",
  958159: "Millonarios",
  960712: "Independiente Medellín",
  974328: "Águilas Doradas",
  1246648: "Llaneros",
  963265: "Atlético Bucaramanga",
  976881: "Fortaleza",
  964967: "Jaguares",
  971775: "Alianza FC",
  964116: "Boyacá Chicó",
  1251754: "Cúcuta Deportivo",
  1244946: "Deportivo Pereira",
};

// Confirmed against real API responses, not just docs — "Half time" (with
// a space) is what Highlightly actually sends, not "Halftime" as guessed
// originally, which silently dropped every match sitting at the break.
type MatchStatus = "SCHEDULED" | "LIVE" | "FINISHED" | "POSTPONED" | "CANCELLED";

const STATUS_MAP: Record<string, MatchStatus> = {
  "Not started": "SCHEDULED",
  "First half": "LIVE",
  "Half time": "LIVE",
  Halftime: "LIVE",
  "Second half": "LIVE",
  "Extra time": "LIVE",
  Penalties: "LIVE",
  Interrupted: "LIVE",
  Suspended: "LIVE",
  Finished: "FINISHED",
  "Finished after extra time": "FINISHED",
  "Finished after penalties": "FINISHED",
  Postponed: "POSTPONED",
  Cancelled: "CANCELLED",
  Abandoned: "CANCELLED",
};

type HighlightlyMatch = {
  id: number;
  date: string;
  round?: string;
  state: {
    clock: number | null;
    description: string;
    score: { current: string | null; penalties: string | null };
  };
  homeTeam: { id: number; name: string };
  awayTeam: { id: number; name: string };
};

async function fetchHighlightly(path: string, params: Record<string, string>) {
  const apiKey = process.env.HIGHLIGHTLY_API_KEY;
  if (!apiKey) throw new Error("Falta configurar HIGHLIGHTLY_API_KEY.");

  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/${path}?${query}`, {
    headers: { "x-rapidapi-key": apiKey },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Highlightly respondió ${res.status}: ${await res.text()}`);
  }

  return res.json();
}

function parseScore(current: string | null): [number | null, number | null] {
  if (!current) return [null, null];
  const m = current.match(/(\d+)\s*-\s*(\d+)/);
  if (!m) return [null, null];
  return [Number(m[1]), Number(m[2])];
}

/**
 * Pulls matches for the configured league and updates status/live
 * score/clock on the matches we already track — never creates matches,
 * jornadas, or teams. Matching is by team id (mapped to our team names)
 * since fixtures are already seeded by hand for this league. MANUAL
 * corrections are never touched, same guarantee as the old API-Football
 * sync.
 */
export async function syncHighlightlyToday(now: Date = new Date()) {
  const leagueId = process.env.HIGHLIGHTLY_LEAGUE_ID;
  if (!leagueId) throw new Error("Falta configurar HIGHLIGHTLY_LEAGUE_ID.");

  // Highlightly's `date` filter is a UTC calendar day, NOT a Colombia
  // civil day — any kickoff at 19:00 COT or later (e.g. the usual 8:15pm
  // slot) lands on a UTC date that can differ from "now"'s once the
  // match's live window straddles UTC midnight (00:00 UTC = 7pm COT): a
  // match still live past that point sits under *yesterday's* UTC date
  // while "now" has already rolled over, so querying only now's date
  // silently loses it mid-match.
  //
  // This used to be handled by reading our own LIVE matches out of the DB
  // and adding their kickoff dates. That's gone on purpose: it cost a DB
  // query on every single tick (which alone kept Neon's compute awake
  // around the clock and burned the monthly quota), and it trusted our own
  // bookkeeping to already be right — the exact assumption that kept
  // breaking. Adding yesterday's date whenever "now" is in the early UTC
  // hours covers the same window with no DB access and no such trust.
  const dates = new Set([now.toISOString().slice(0, 10)]);
  if (now.getUTCHours() < 4) {
    dates.add(new Date(now.getTime() - 24 * 60 * 60_000).toISOString().slice(0, 10));
  }

  const fixtures: HighlightlyMatch[] = [];
  const seenFixtureIds = new Set<number>();
  for (const date of dates) {
    const data = await fetchHighlightly("matches", { leagueId, date });
    for (const f of (data.data ?? []) as HighlightlyMatch[]) {
      if (seenFixtureIds.has(f.id)) continue;
      seenFixtureIds.add(f.id);
      fixtures.push(f);
    }
  }

  let skippedUnmapped = 0;
  let skippedUnknownStatus = 0;
  let skippedWrongStage = 0;

  // Resolve everything we can without touching the database first, so a day
  // with no Liga BetPlay fixtures (most days) costs zero DB queries and
  // lets Neon's compute stay suspended.
  const actionable: Array<{
    fixture: HighlightlyMatch;
    homeName: string;
    awayName: string;
    status: MatchStatus;
  }> = [];

  for (const f of fixtures) {
    // Highlightly has occasionally returned a stale Apertura (2026-I)
    // fixture for a team pair under a Clausura-season date query — caught
    // live when Fortaleza vs Cúcuta got marked FINISHED with January's
    // Apertura score (1-1) days before the real Clausura match kicked off.
    // We only ever track Clausura, so any fixture explicitly tagged as a
    // different stage is skipped; fixtures with no round info still match
    // as before.
    if (f.round && !f.round.startsWith("Clausura")) {
      skippedWrongStage++;
      continue;
    }

    const homeName = TEAM_ID_TO_NAME[f.homeTeam.id];
    const awayName = TEAM_ID_TO_NAME[f.awayTeam.id];
    if (!homeName || !awayName) {
      skippedUnmapped++;
      continue;
    }

    const status = STATUS_MAP[f.state.description];
    if (!status) {
      skippedUnknownStatus++;
      continue;
    }

    actionable.push({ fixture: f, homeName, awayName, status });
  }

  // On a match day the day's fixtures are returned from 00:00, but a fixture
  // that is still "Not started" and hours away has nothing we could write —
  // so the ticks from early morning until shortly before the first kickoff
  // don't need to wake the database at all. Anything else IS worth a look:
  // a postponement, a suspension, a live clock, a final score, or a fixture
  // whose kickoff has already passed while it still reads as not started.
  // Note this deliberately keys off Highlightly's own kickoff time, never
  // our stored one, so a wrong kickoff on our side can't hide a fixture.
  const LOOKAHEAD_MS = 2 * 60 * 60_000;
  const needsDb = actionable.some(
    ({ fixture, status }) =>
      status !== "SCHEDULED" || new Date(fixture.date).getTime() - now.getTime() < LOOKAHEAD_MS,
  );

  if (actionable.length === 0 || !needsDb) {
    return {
      total: fixtures.length,
      updated: 0,
      skippedManual: 0,
      skippedNoMatch: 0,
      skippedUnmapped,
      skippedUnknownStatus,
      skippedWrongStage,
      touchedDb: false,
    };
  }

  // Two queries total for the whole batch, instead of the 3-4 per fixture
  // the per-fixture findUnique/findFirst lookups used to cost.
  const names = new Set<string>();
  for (const a of actionable) {
    names.add(a.homeName);
    names.add(a.awayName);
  }
  const teams = await prisma.team.findMany({ where: { name: { in: [...names] } } });
  const teamIdByName = new Map(teams.map((t) => [t.name, t.id]));

  const teamIds = teams.map((t) => t.id);
  const candidates = await prisma.match.findMany({
    where: { homeTeamId: { in: teamIds }, awayTeamId: { in: teamIds } },
  });
  const matchByPair = new Map(candidates.map((m) => [`${m.homeTeamId}|${m.awayTeamId}`, m]));

  let updated = 0;
  let skippedManual = 0;
  let skippedNoMatch = 0;

  for (const { fixture: f, homeName, awayName, status } of actionable) {
    const homeTeamId = teamIdByName.get(homeName);
    const awayTeamId = teamIdByName.get(awayName);
    if (!homeTeamId || !awayTeamId) {
      skippedUnmapped++;
      continue;
    }

    // Same pair-matching as before: exact orientation first, then the
    // swapped one, since our seeded home/away doesn't always match theirs.
    let existing = matchByPair.get(`${homeTeamId}|${awayTeamId}`);
    let swapped = false;
    if (!existing) {
      existing = matchByPair.get(`${awayTeamId}|${homeTeamId}`);
      swapped = true;
    }
    if (!existing) {
      skippedNoMatch++;
      continue;
    }
    if (existing.resultSource === "MANUAL") {
      skippedManual++;
      continue;
    }

    const [rawHome, rawAway] = parseScore(f.state.score.current);
    const homeScore = swapped ? rawAway : rawHome;
    const awayScore = swapped ? rawHome : rawAway;

    await prisma.match.update({
      where: { id: existing.id },
      data: {
        status,
        lastSyncedAt: new Date(),
        ...(status === "LIVE" || status === "FINISHED"
          ? {
              homeScore,
              awayScore,
              resultSource: "API" as const,
              liveMinute: status === "LIVE" ? f.state.clock : null,
              livePeriod: status === "LIVE" ? f.state.description : null,
            }
          : { liveMinute: null, livePeriod: null }),
      },
    });
    updated++;
  }

  // Checked last, after this tick's own updates have already landed, so a
  // match this very run just correctly flipped to FINISHED never triggers a
  // false alarm — only a match that is STILL LIVE despite everything above
  // counts as actually stuck.
  const stale = await prisma.match.findMany({
    where: { status: "LIVE", kickoff: { lt: new Date(now.getTime() - STUCK_LIVE_THRESHOLD_MS) } },
    include: { homeTeam: true, awayTeam: true },
  });
  let stuckAlert: Awaited<ReturnType<typeof notifyStuckMatches>> | null = null;
  if (stale.length > 0) {
    stuckAlert = await notifyStuckMatches(
      stale.map((m) => ({
        matchId: m.id,
        homeTeam: m.homeTeam.name,
        awayTeam: m.awayTeam.name,
        kickoffLabel: m.kickoff.toLocaleString("es-CO", {
          timeZone: "America/Bogota",
          weekday: "short",
          hour: "2-digit",
          minute: "2-digit",
        }),
        hoursSinceKickoff: (now.getTime() - m.kickoff.getTime()) / 3_600_000,
      })),
    ).catch(() => null);
  }

  return {
    total: fixtures.length,
    updated,
    skippedManual,
    skippedNoMatch,
    skippedUnmapped,
    skippedUnknownStatus,
    skippedWrongStage,
    touchedDb: true,
    stuckMatches: stale.length,
    stuckAlert,
  };
}


/**
 * Full-season reconciliation: pulls every Clausura fixture from Highlightly
 * and makes our copy of the calendar match it — kickoff time, status and
 * score — for the whole season at once.
 *
 * Why this exists: the per-day sync only ever looks at fixtures playing
 * today, so any match whose *schedule* drifted (Dimayor moves a kickoff by
 * a couple of hours, or to another day entirely, which happens constantly
 * around postponements) silently kept our stale date forever. Nothing ever
 * went back to check. That is how the calendar ended up with matches
 * sitting on the wrong day, in the wrong order, and two matches frozen
 * mid-live days after they had actually finished — the per-day sync had
 * simply stopped looking at them.
 *
 * It is deliberately cheap: the season endpoint pages 100 fixtures at a
 * time, so the whole 190-match season costs 2 API calls and 2 database
 * reads regardless of how much has drifted. That is less than the old
 * one-call-per-postponed-match check it replaces.
 *
 * MANUAL results are never touched, same guarantee as everywhere else.
 */
export async function reconcileSeason(season = "2026") {
  const leagueId = process.env.HIGHLIGHTLY_LEAGUE_ID;
  if (!leagueId) throw new Error("Falta configurar HIGHLIGHTLY_LEAGUE_ID.");

  const fixtures: HighlightlyMatch[] = [];
  let offset = 0;
  let totalCount: number | null = null;
  // Hard page cap so a malformed pagination response can never spin here.
  for (let page = 0; page < 20; page++) {
    const data = await fetchHighlightly("matches", {
      leagueId,
      season,
      offset: String(offset),
      limit: "100",
    });
    const batch = (data.data ?? []) as HighlightlyMatch[];
    fixtures.push(...batch);
    totalCount = data.pagination?.totalCount ?? fixtures.length;
    offset += 100;
    if (batch.length === 0 || fixtures.length >= (totalCount ?? 0)) break;
  }

  const clausura = fixtures.filter((f) => f.round?.startsWith("Clausura"));

  const teams = await prisma.team.findMany();
  const teamIdByName = new Map(teams.map((t) => [t.name, t.id]));
  const matches = await prisma.match.findMany({ include: { jornada: true } });
  const byPair = new Map(matches.map((m) => [`${m.homeTeamId}|${m.awayTeamId}`, m]));

  let checked = 0;
  let fixedKickoff = 0;
  let fixedStatus = 0;
  let fixedScore = 0;
  let skippedManual = 0;
  let skippedUnmapped = 0;
  let skippedNoMatch = 0;
  let jornadaMismatch = 0;
  let revertedImpossible = 0;
  const changes: string[] = [];
  const manualMismatches: ManualMismatchRow[] = [];

  for (const f of clausura) {
    const homeName = TEAM_ID_TO_NAME[f.homeTeam.id];
    const awayName = TEAM_ID_TO_NAME[f.awayTeam.id];
    if (!homeName || !awayName) {
      skippedUnmapped++;
      continue;
    }
    const homeTeamId = teamIdByName.get(homeName);
    const awayTeamId = teamIdByName.get(awayName);
    if (!homeTeamId || !awayTeamId) {
      skippedUnmapped++;
      continue;
    }

    let existing = byPair.get(`${homeTeamId}|${awayTeamId}`);
    let swapped = false;
    if (!existing) {
      existing = byPair.get(`${awayTeamId}|${homeTeamId}`);
      swapped = true;
    }
    if (!existing) {
      skippedNoMatch++;
      continue;
    }
    const status = STATUS_MAP[f.state.description];
    if (!status) continue;

    const [rawHomeScore, rawAwayScore] = parseScore(f.state.score.current);
    const apiHomeScore = swapped ? rawAwayScore : rawHomeScore;
    const apiAwayScore = swapped ? rawHomeScore : rawAwayScore;

    // A MANUAL result is a deliberate correction by the admin, so it is
    // still never overwritten. But it used to be skipped in *silence*, and
    // that is exactly how a wrong manual score survived: the one thing that
    // checks the whole season against reality was also the one thing
    // structurally unable to see it. Fecha 13 sat at 1-2 for days when it
    // had finished 2-3, and no amount of reconciling would ever have caught
    // it. Now a disagreement is reported so somebody can decide, which is
    // the part that actually needs a human.
    if (existing.resultSource === "MANUAL") {
      // The one MANUAL case that IS corrected automatically: a "final"
      // result on a match that, by Dimayor's own kickoff time, cannot have
      // finished yet. That is not an admin judgment to respect, it is
      // impossible data — in practice a prediction typed into the admin
      // result form — and it awards points for a game nobody has played.
      // Leaving it for a human was exactly what let six of them pile up.
      // Everything else MANUAL stays frozen and is only reported below.
      const apiKickoff = new Date(f.date);
      if (existing.status === "FINISHED" && !canHaveFinalResult(apiKickoff, new Date())) {
        const carries = status === "LIVE" || status === "FINISHED";
        await prisma.match.update({
          where: { id: existing.id },
          data: {
            kickoff: apiKickoff,
            status,
            lastSyncedAt: new Date(),
            ...(carries && apiHomeScore !== null
              ? {
                  homeScore: apiHomeScore,
                  awayScore: apiAwayScore,
                  resultSource: "API" as const,
                  liveMinute: status === "LIVE" ? f.state.clock : null,
                  livePeriod: status === "LIVE" ? f.state.description : null,
                }
              : {
                  homeScore: null,
                  awayScore: null,
                  resultSource: null,
                  liveMinute: null,
                  livePeriod: null,
                }),
          },
        });
        revertedImpossible++;
        changes.push(
          `${homeName} vs ${awayName}: resultado manual imposible ${existing.homeScore}-${existing.awayScore} revertido (el partido aún no había terminado), ahora ${status}`,
        );
        manualMismatches.push({
          matchId: existing.id,
          homeTeam: homeName,
          awayTeam: awayName,
          jornada: existing.jornada.number,
          ourHome: existing.homeScore,
          ourAway: existing.awayScore,
          realHome: carries ? apiHomeScore : null,
          realAway: carries ? apiAwayScore : null,
          reverted: true,
        });
        continue;
      }

      skippedManual++;
      const disagrees =
        status === "FINISHED" &&
        apiHomeScore !== null &&
        (existing.homeScore !== apiHomeScore || existing.awayScore !== apiAwayScore);
      if (disagrees) {
        manualMismatches.push({
          matchId: existing.id,
          homeTeam: homeName,
          awayTeam: awayName,
          jornada: existing.jornada.number,
          ourHome: existing.homeScore,
          ourAway: existing.awayScore,
          realHome: apiHomeScore,
          realAway: apiAwayScore,
          reverted: false,
        });
      }
      continue;
    }

    checked++;

    // Which fecha Dimayor has it under. Only reported, never rewritten:
    // moving a match between fechas changes which round players were
    // scored on, so that is a decision to make deliberately, not a silent
    // background edit.
    const roundNo = Number(f.round?.match(/(\d+)/)?.[1] ?? 0);
    if (roundNo && existing.jornada.number !== roundNo) jornadaMismatch++;

    const apiKickoff = new Date(f.date);
    const kickoffChanged = existing.kickoff.getTime() !== apiKickoff.getTime();

    const homeScore = apiHomeScore;
    const awayScore = apiAwayScore;
    const carriesScore = status === "LIVE" || status === "FINISHED";
    const scoreChanged =
      carriesScore && homeScore !== null && (existing.homeScore !== homeScore || existing.awayScore !== awayScore);
    const statusChanged = existing.status !== status;

    if (!kickoffChanged && !statusChanged && !scoreChanged) continue;

    await prisma.match.update({
      where: { id: existing.id },
      data: {
        kickoff: apiKickoff,
        status,
        lastSyncedAt: new Date(),
        ...(carriesScore && homeScore !== null
          ? {
              homeScore,
              awayScore,
              resultSource: "API" as const,
              liveMinute: status === "LIVE" ? f.state.clock : null,
              livePeriod: status === "LIVE" ? f.state.description : null,
            }
          : { liveMinute: null, livePeriod: null }),
      },
    });

    if (kickoffChanged) fixedKickoff++;
    if (statusChanged) fixedStatus++;
    if (scoreChanged) fixedScore++;
    changes.push(
      `${homeName} vs ${awayName}: ` +
        [
          kickoffChanged ? `hora ${existing.kickoff.toISOString()} -> ${f.date}` : null,
          statusChanged ? `estado ${existing.status} -> ${status}` : null,
          scoreChanged ? `marcador ${existing.homeScore}-${existing.awayScore} -> ${homeScore}-${awayScore}` : null,
        ]
          .filter(Boolean)
          .join(", "),
    );
  }

  // Never auto-corrected (see the MANUAL branch above), but never silent
  // either: this is the only pass that looks at the whole season, so if it
  // says nothing about a bad manual score, nothing ever will.
  const manualMismatchAlert = await notifyManualMismatches(manualMismatches).catch(() => null);

  return {
    fixturesSeen: clausura.length,
    checked,
    fixedKickoff,
    fixedStatus,
    fixedScore,
    skippedManual,
    skippedUnmapped,
    skippedNoMatch,
    jornadaMismatch,
    revertedImpossible,
    changes,
    manualMismatches,
    manualMismatchAlert,
  };
}
