import Link from "next/link";
import { Trophy } from "lucide-react";
import { CountdownTimer } from "@/components/match/CountdownTimer";
import { COLOMBIA_TIME_ZONE } from "@/lib/match-time";
import { SectionLabel } from "@/components/ui/SectionLabel";
import type { MatchView } from "@/lib/matches-service";
import type { LeaderboardEntry } from "@/lib/leaderboard-service";

export function PartidosSidebar({
  clubId,
  nextMatch,
  topThree,
}: {
  clubId: string;
  nextMatch: MatchView | undefined;
  topThree: LeaderboardEntry[];
}) {
  return (
    <div className="sticky top-6">
      {nextMatch && (
        <>
      <SectionLabel>Próximo partido</SectionLabel>
      <div className="ticket-card relative border-gold p-4 shadow-[0_0_0_1px_rgba(255,199,44,0.25),0_4px_18px_rgba(255,199,44,0.08)]">
        {!nextMatch.started && (
          <div className="absolute -top-2.5 right-4">
            <CountdownTimer kickoff={nextMatch.kickoff.toISOString()} />
          </div>
        )}
        <div className="text-center text-xs text-ink-dim">
          {new Date(nextMatch.kickoff).toLocaleDateString("es-CO", {
            timeZone: COLOMBIA_TIME_ZONE,
            weekday: "long",
            day: "2-digit",
            month: "short",
          })}{" "}
          ·{" "}
          {new Date(nextMatch.kickoff).toLocaleTimeString("es-CO", {
            timeZone: COLOMBIA_TIME_ZONE,
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
        <div className="mt-2 flex items-center justify-center gap-3 font-display text-lg">
          <span>{nextMatch.homeTeam.name}</span>
          <span className="text-ink-faint">vs</span>
          <span>{nextMatch.awayTeam.name}</span>
        </div>
      </div>

        </>
      )}

      <SectionLabel className={nextMatch ? "mt-7" : ""}>Top del club</SectionLabel>
      <div className="card">
        {topThree.map((entry, i) => (
          <div
            key={entry.userId}
            className={`flex items-center gap-2.5 py-2 ${
              i < topThree.length - 1 ? "border-b border-line" : ""
            }`}
          >
            <span className={`font-display text-sm ${entry.rank === 1 ? "text-gold" : "text-ink-faint"}`}>
              {entry.rank}
            </span>
            <span className="flex-1 text-sm">{entry.userName}</span>
            <span className="font-display text-lg text-gold">{entry.points}</span>
          </div>
        ))}
        {topThree.length === 0 && <p className="py-2 text-xs text-ink-faint">Aún sin puntos.</p>}
        <Link
          href={`/clubs/${clubId}/clasificacion`}
          className="mt-3 flex items-center gap-1.5 text-xs text-ink-dim hover:text-gold"
        >
          <Trophy size={13} /> Ver tabla completa
        </Link>
      </div>
    </div>
  );
}
