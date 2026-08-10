import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { MatchStatus } from "@/app/generated/prisma/client";

const VALID_STATUSES: MatchStatus[] = ["SCHEDULED", "LIVE", "FINISHED", "POSTPONED", "CANCELLED"];

// Read-only dump for full-season audits — same shared-secret protection as
// the POST corrections below.
export async function GET(request: Request) {
  if (request.headers.get("x-cron-secret") !== process.env.CRON_SHARED_SECRET) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const matches = await prisma.match.findMany({
    include: { homeTeam: true, awayTeam: true, jornada: true },
    orderBy: { kickoff: "asc" },
  });

  return NextResponse.json(
    matches.map((m) => ({
      id: m.id,
      jornada: m.jornada.number,
      home: m.homeTeam.name,
      away: m.awayTeam.name,
      kickoff: m.kickoff,
      status: m.status,
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      resultSource: m.resultSource,
    })),
  );
}

// One-off admin correction (postponements, rescheduled kickoffs) — protected
// by the same shared secret as the cron route so it isn't publicly callable.
export async function POST(request: Request) {
  if (request.headers.get("x-cron-secret") !== process.env.CRON_SHARED_SECRET) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const body = await request.json();
  const { externalFixtureId, status, kickoff, homeTeamName, awayTeamName, homeScore, awayScore, unfreeze } =
    body as {
      externalFixtureId?: string;
      status?: string;
      kickoff?: string;
      homeTeamName?: string;
      awayTeamName?: string;
      homeScore?: number;
      awayScore?: number;
      unfreeze?: boolean;
    };

  if (status && !VALID_STATUSES.includes(status as MatchStatus)) {
    return NextResponse.json({ error: "Status inválido." }, { status: 400 });
  }
  if (
    (homeScore != null || awayScore != null) &&
    (!Number.isInteger(homeScore) || !Number.isInteger(awayScore) || homeScore! < 0 || awayScore! < 0)
  ) {
    return NextResponse.json({ error: "Marcador inválido." }, { status: 400 });
  }

  // Score corrections (e.g. the API froze on a stale live score) don't have
  // a reliable externalFixtureId to key off — our sync never stores one, it
  // matches fixtures by team id pair every run instead — so this path finds
  // the match by team names, same as syncHighlightlyToday, and freezes the
  // fix with MANUAL so the sync can never clobber it back to the stale value.
  if (homeTeamName && awayTeamName) {
    const [homeTeam, awayTeam] = await Promise.all([
      prisma.team.findUnique({ where: { name: homeTeamName } }),
      prisma.team.findUnique({ where: { name: awayTeamName } }),
    ]);
    if (!homeTeam || !awayTeam) {
      return NextResponse.json({ error: "Equipo no encontrado." }, { status: 400 });
    }
    const existing = await prisma.match.findFirst({
      where: { homeTeamId: homeTeam.id, awayTeamId: awayTeam.id },
      orderBy: { kickoff: "desc" },
    });
    if (!existing) {
      return NextResponse.json({ error: "Partido no encontrado." }, { status: 404 });
    }
    const match = await prisma.match.update({
      where: { id: existing.id },
      data: {
        ...(homeScore != null ? { homeScore, awayScore, resultSource: "MANUAL" as const } : {}),
        // Undo a wrong manual correction: clears the score and MANUAL freeze
        // so syncHighlightlyToday can pick this match back up on its own.
        ...(unfreeze ? { homeScore: null, awayScore: null, resultSource: null, liveMinute: null, livePeriod: null } : {}),
        ...(status ? { status: status as MatchStatus } : {}),
        ...(kickoff ? { kickoff: new Date(kickoff) } : {}),
      },
      include: { homeTeam: true, awayTeam: true },
    });
    return NextResponse.json({
      id: match.id,
      home: match.homeTeam.name,
      away: match.awayTeam.name,
      status: match.status,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      kickoff: match.kickoff,
    });
  }

  if (!externalFixtureId) {
    return NextResponse.json({ error: "Falta externalFixtureId o homeTeamName/awayTeamName." }, { status: 400 });
  }

  const match = await prisma.match.update({
    where: { externalFixtureId },
    data: {
      ...(status ? { status: status as MatchStatus } : {}),
      ...(kickoff ? { kickoff: new Date(kickoff) } : {}),
    },
    include: { homeTeam: true, awayTeam: true },
  });

  return NextResponse.json({
    id: match.id,
    home: match.homeTeam.name,
    away: match.awayTeam.name,
    status: match.status,
    kickoff: match.kickoff,
  });
}
