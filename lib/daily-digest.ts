import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { isSameColombiaDay } from "@/lib/match-time";
import { PLAYOFF_SEASON_KEY } from "@/lib/playoffs";
import { getClubLeaderboard } from "@/lib/leaderboard-service";
import {
  dailyDigestEmailHtml,
  dailyDigestEmailText,
  type DigestClubRow,
  type DigestMatchRow,
} from "@/lib/email-templates";

const resend = new Resend(process.env.RESEND_API_KEY);

const MOTIVATIONAL = {
  leader: [
    "Vas primero. Que no se te note el afán, pero cuida la ventaja.",
    "La cima es tuya por ahora. Sigue prediciendo con cabeza fría.",
    "Nadie te alcanza si sigues así. A mantener el paso.",
  ],
  middle: [
    "Estás en la pelea. Un par de marcadores exactos y subes puesto.",
    "Nada está decidido todavía. Hoy es un buen día para arriesgar un pronóstico.",
    "A mitad de tabla se gana el título: sigue prediciendo cada fecha.",
  ],
  bottom: [
    "Toda racha empieza en algún partido. Hoy puede ser el tuyo.",
    "Nadie recuerda cómo empezaste, solo cómo terminaste. A remontar.",
    "El que no se rinde, no pierde. Vamos por esos puntos hoy.",
  ],
} as const;

function pickMotivational(rank: number, total: number): string {
  if (total <= 1) return "Sigue prediciendo, cada fecha suma puntos.";
  const tier = rank === 1 ? MOTIVATIONAL.leader : rank >= total - 1 ? MOTIVATIONAL.bottom : MOTIVATIONAL.middle;
  return tier[Math.floor(Math.random() * tier.length)];
}

function fmtKickoff(d: Date) {
  const datePart = d.toLocaleDateString("es-CO", {
    timeZone: "America/Bogota",
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
  const timePart = d.toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Bogota",
  });
  return `${datePart} · ${timePart}`;
}

export type DigestForUser = {
  userId: string;
  email: string;
  subject: string;
  html: string;
  text: string;
  missingCount: number;
};

/**
 * Builds one digest per user who belongs to at least one club, for every
 * match kicking off today (Colombia time). Returns null if there are no
 * matches today at all — the caller should skip sending entirely on those
 * days rather than mailing an empty digest.
 */
export async function buildDailyDigests(now: Date = new Date()): Promise<DigestForUser[] | null> {
  const allMatches = await prisma.match.findMany({
    where: { status: { notIn: ["POSTPONED", "CANCELLED"] } },
    include: { homeTeam: true, awayTeam: true, jornada: { include: { season: true } } },
    orderBy: { kickoff: "asc" },
  });
  const todaysMatches = allMatches.filter((m) => isSameColombiaDay(m.kickoff, now));
  if (todaysMatches.length === 0) return null;

  // On a cuadrangulares day the mail goes only to the people playing them
  // (per club), with that table; nobody else has a marcador to put.
  const playoffDay = todaysMatches.some((m) => m.jornada.season.externalId === PLAYOFF_SEASON_KEY);
  const torneo = playoffDay ? ("cuadrangulares" as const) : ("liga" as const);
  if (playoffDay) {
    for (let i = todaysMatches.length - 1; i >= 0; i--) {
      if (todaysMatches[i].jornada.season.externalId !== PLAYOFF_SEASON_KEY) todaysMatches.splice(i, 1);
    }
  }

  const allMemberships = await prisma.membership.findMany({
    include: { user: true, club: true },
  });
  const accepted = playoffDay
    ? new Set(
        (
          await prisma.tournamentEntry.findMany({
            where: { accepted: true, season: { externalId: PLAYOFF_SEASON_KEY } },
            select: { userId: true, clubId: true },
          })
        ).map((e) => `${e.userId}|${e.clubId}`),
      )
    : null;
  const memberships = accepted
    ? allMemberships.filter((m) => accepted.has(`${m.userId}|${m.clubId}`))
    : allMemberships;
  if (memberships.length === 0) return null;

  const membershipsByUser = new Map<string, typeof memberships>();
  for (const m of memberships) {
    if (!membershipsByUser.has(m.userId)) membershipsByUser.set(m.userId, []);
    membershipsByUser.get(m.userId)!.push(m);
  }

  const todaysMatchIds = todaysMatches.map((m) => m.id);
  const predictions = await prisma.prediction.findMany({
    where: { matchId: { in: todaysMatchIds } },
  });
  const predictionIndex = new Map<string, Map<string, { homeScore: number; awayScore: number }>>();
  for (const p of predictions) {
    if (!predictionIndex.has(p.userId)) predictionIndex.set(p.userId, new Map());
    predictionIndex.get(p.userId)!.set(p.matchId, p);
  }

  const clubIds = Array.from(new Set(memberships.map((m) => m.clubId)));
  const leaderboards = new Map<string, Awaited<ReturnType<typeof getClubLeaderboard>>["entries"]>();
  for (const clubId of clubIds) {
    const { entries } = await getClubLeaderboard(clubId, torneo);
    leaderboards.set(clubId, entries);
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://www.pollabetplay.com").replace(/\/$/, "");
  const digests: DigestForUser[] = [];

  for (const [userId, memberRows] of membershipsByUser) {
    const user = memberRows[0].user;
    if (!user.email) continue;

    const myPreds = predictionIndex.get(userId) ?? new Map();
    const matches: DigestMatchRow[] = todaysMatches.map((m) => {
      const p = myPreds.get(m.id);
      return {
        homeTeam: m.homeTeam.name,
        awayTeam: m.awayTeam.name,
        kickoffLabel: fmtKickoff(m.kickoff),
        predicted: !!p,
        predictionText: p ? `${p.homeScore}-${p.awayScore}` : null,
      };
    });
    const missingCount = matches.filter((m) => !m.predicted).length;

    const clubs: DigestClubRow[] = memberRows.map((mem) => {
      const entries = leaderboards.get(mem.clubId) ?? [];
      const idx = entries.findIndex((e) => e.userId === userId);
      const rank = idx === -1 ? entries.length || 1 : entries[idx].rank;
      const points = idx === -1 ? 0 : entries[idx].points;
      return {
        clubName: mem.club.name,
        clubId: mem.clubId,
        rank,
        total: Math.max(entries.length, 1),
        points,
        motivational: pickMotivational(rank, Math.max(entries.length, 1)),
      };
    });

    const params = {
      userName: user.name ?? "jugador",
      matches,
      missingCount,
      clubs,
      appUrl,
      primaryClubId: memberRows[0].clubId,
    };

    digests.push({
      userId,
      email: user.email,
      subject:
        missingCount > 0
          ? `Te ${missingCount === 1 ? "falta 1 marcador" : `faltan ${missingCount} marcadores`} hoy — La Polla BetPlay`
          : "Los partidos de hoy — La Polla BetPlay",
      html: dailyDigestEmailHtml(params),
      text: dailyDigestEmailText(params),
      missingCount,
    });
  }

  return digests;
}

export async function sendDailyDigests(now: Date = new Date()) {
  const digests = await buildDailyDigests(now);
  if (!digests) return { skipped: true, reason: "No hay partidos hoy." };

  let sent = 0;
  let failed = 0;
  const errors: Array<{ email: string; error: string }> = [];

  for (const d of digests) {
    try {
      await resend.emails.send({
        from: process.env.EMAIL_FROM!,
        to: d.email,
        subject: d.subject,
        html: d.html,
        text: d.text,
      });
      sent++;
    } catch (e) {
      failed++;
      errors.push({ email: d.email, error: e instanceof Error ? e.message : String(e) });
    }
  }

  return { sent, failed, total: digests.length, errors };
}

/** Sends just one user's digest (by email) — used for manual test sends. */
export async function sendDailyDigestToEmail(email: string, now: Date = new Date()) {
  const digests = await buildDailyDigests(now);
  if (!digests) return { skipped: true, reason: "No hay partidos hoy." };

  const mine = digests.find((d) => d.email.toLowerCase() === email.toLowerCase());
  if (!mine) return { skipped: true, reason: "Ese correo no pertenece a ningún miembro de un club." };

  await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: mine.email,
    subject: `[PRUEBA] ${mine.subject}`,
    html: mine.html,
    text: mine.text,
  });

  return { sent: true, email: mine.email, missingCount: mine.missingCount };
}
