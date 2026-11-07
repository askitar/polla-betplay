import Link from "next/link";
import { Trophy, ChevronRight } from "lucide-react";
import { CountdownTimer } from "@/components/match/CountdownTimer";
import { TeamBadge } from "@/components/ui/TeamBadge";
import { GlassIcon } from "@/components/ui/GlassIcon";
import { COLOMBIA_TIME_ZONE } from "@/lib/match-time";
import { SectionLabel } from "@/components/ui/SectionLabel";
import type { MatchView } from "@/lib/matches-service";
import type { LeaderboardEntry } from "@/lib/leaderboard-service";

const RANK_TINT = ["gold", "silver", "bronze"] as const;

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
    <div className="sticky top-24 flex flex-col gap-7">
      {nextMatch && (
        <div>
          <SectionLabel>Próximo partido</SectionLabel>
          <div className="ticket-card relative border-gold/60 p-5 shadow-[0_0_0_1px_rgba(255,199,44,0.25),0_18px_50px_-14px_rgba(255,199,44,0.35)]">
            {!nextMatch.started && <CountdownTimer kickoff={nextMatch.kickoff.toISOString()} />}
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
            <div className="mt-3 flex items-center justify-between gap-2">
              <div className="flex flex-1 flex-col items-center gap-1.5 text-center">
                <TeamBadge name={nextMatch.homeTeam.name} uid="side-home" size={44} />
                <span className="text-[12px] font-semibold leading-tight">{nextMatch.homeTeam.name}</span>
              </div>
              <span className="font-display text-xl text-ink-faint">vs</span>
              <div className="flex flex-1 flex-col items-center gap-1.5 text-center">
                <TeamBadge name={nextMatch.awayTeam.name} uid="side-away" size={44} />
                <span className="text-[12px] font-semibold leading-tight">{nextMatch.awayTeam.name}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div>
        <SectionLabel>Top del club</SectionLabel>
        <div className="card p-3">
          {topThree.map((entry, i) => (
            <div
              key={entry.userId}
              className={`flex items-center gap-3 px-1.5 py-2.5 ${
                i < topThree.length - 1 ? "border-b border-white/[0.06]" : ""
              }`}
            >
              <GlassIcon icon={Trophy} tint={RANK_TINT[Math.min(entry.rank, 3) - 1] ?? "ink"} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{entry.userName}</div>
                <div className="text-[11px] text-ink-faint">
                  {entry.lastPoints == null ? "sin predicción en el último" : `+${entry.lastPoints} en el último`}
                </div>
              </div>
              <span className="num-gold font-display text-2xl leading-none">{entry.points}</span>
            </div>
          ))}
          {topThree.length === 0 && <p className="px-1.5 py-2 text-xs text-ink-faint">Aún sin puntos.</p>}
          <Link
            href={`/clubs/${clubId}/clasificacion`}
            className="mt-2 flex items-center justify-between rounded-xl px-1.5 py-2 text-xs text-ink-dim transition hover:bg-white/[0.04] hover:text-gold"
          >
            Ver tabla completa <ChevronRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
