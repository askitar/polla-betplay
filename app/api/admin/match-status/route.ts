import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { MatchStatus } from "@/app/generated/prisma/client";

const VALID_STATUSES: MatchStatus[] = ["SCHEDULED", "LIVE", "FINISHED", "POSTPONED", "CANCELLED"];

// One-off admin correction (postponements, rescheduled kickoffs) — protected
// by the same shared secret as the cron route so it isn't publicly callable.
export async function POST(request: Request) {
  if (request.headers.get("x-cron-secret") !== process.env.CRON_SHARED_SECRET) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const body = await request.json();
  const { externalFixtureId, status, kickoff } = body as {
    externalFixtureId?: string;
    status?: string;
    kickoff?: string;
  };

  if (!externalFixtureId) {
    return NextResponse.json({ error: "Falta externalFixtureId." }, { status: 400 });
  }
  if (status && !VALID_STATUSES.includes(status as MatchStatus)) {
    return NextResponse.json({ error: "Status inválido." }, { status: 400 });
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
