"use client";

import { useState } from "react";
import { ChevronDown, Crown, Medal, Award } from "lucide-react";
import { GlassIcon } from "@/components/ui/GlassIcon";
import { PlayerStatsPanel } from "@/components/leaderboard/PlayerStatsPanel";
import type { LeaderboardEntry } from "@/lib/leaderboard-service";
import type { PlayerStats } from "@/lib/player-stats-service";

const MEDAL = {
  1: { icon: Crown, tint: "gold" },
  2: { icon: Medal, tint: "silver" },
  3: { icon: Award, tint: "bronze" },
} as const;

export function LeaderboardList({
  leaderboard,
  statsByUser,
}: {
  leaderboard: LeaderboardEntry[];
  statsByUser: Record<string, PlayerStats>;
}) {
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-2">
      {leaderboard.map((entry, i) => {
        const isExpanded = expandedUserId === entry.userId;
        const medal = MEDAL[entry.rank as 1 | 2 | 3];
        return (
          <div
            key={entry.userId}
            className={`rise overflow-hidden rounded-2xl border transition-colors ${
              medal ? "border-white/10 bg-white/[0.035]" : "border-white/[0.06] bg-white/[0.02]"
            } ${isExpanded ? "ring-1 ring-gold/30" : ""}`}
            style={{ "--i": Math.min(i, 8) } as React.CSSProperties}
          >
            <button
              type="button"
              onClick={() => setExpandedUserId(isExpanded ? null : entry.userId)}
              aria-expanded={isExpanded}
              className="hover-glow flex w-full items-center gap-3 px-3 py-3 text-left"
            >
              {medal ? (
                <GlassIcon icon={medal.icon} tint={medal.tint} size="sm" />
              ) : (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[30%] border border-white/[0.08] bg-white/[0.03] font-display text-base text-ink-faint">
                  {entry.rank}
                </div>
              )}
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/15 bg-card-hover shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
                {entry.userImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={entry.userImage} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center font-condensed text-xs font-semibold text-ink-dim">
                    {entry.userName.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-[15px] font-semibold">{entry.userName}</span>
                  {medal && <span className="font-display text-xs text-ink-faint">{entry.rank}°</span>}
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-ink-dim">
                  <span>{entry.played} pred. · {entry.exact} exactas</span>
                  <span
                    className={`chip ${
                      entry.lastPoints == null ? "" : entry.lastPoints > 0 ? "chip-green" : ""
                    }`}
                    title="Puntos en el último partido"
                  >
                    {entry.lastPoints == null ? "sin pred. últ." : `+${entry.lastPoints} últ.`}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="num-gold font-display text-[28px] leading-none">{entry.points}</span>
                <ChevronDown
                  size={16}
                  className={`text-ink-faint transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
                />
              </div>
            </button>
            {isExpanded && statsByUser[entry.userId] && (
              <div className="px-3 pb-3">
                <PlayerStatsPanel stats={statsByUser[entry.userId]} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
