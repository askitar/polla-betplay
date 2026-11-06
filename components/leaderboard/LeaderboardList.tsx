"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { PlayerStatsPanel } from "@/components/leaderboard/PlayerStatsPanel";
import type { LeaderboardEntry } from "@/lib/leaderboard-service";
import type { PlayerStats } from "@/lib/player-stats-service";

// The top 3 are the ones actually in title contention, so they get a medal
// treatment beyond the plain rank digit: a colored ring around the number
// and a soft gradient underline instead of the flat row divider.
const MEDAL_STYLES = [
  {
    badge: "text-gold ring-1 ring-gold/60 shadow-[0_0_14px_rgba(255,199,44,0.4)]",
    underline: "after:from-transparent after:via-gold after:to-transparent",
  },
  {
    badge: "text-silver ring-1 ring-silver/60 shadow-[0_0_12px_rgba(213,221,226,0.3)]",
    underline: "after:from-transparent after:via-silver after:to-transparent",
  },
  {
    badge: "text-bronze ring-1 ring-bronze/60 shadow-[0_0_12px_rgba(217,147,86,0.3)]",
    underline: "after:from-transparent after:via-bronze after:to-transparent",
  },
];

export function LeaderboardList({
  leaderboard,
  statsByUser,
}: {
  leaderboard: LeaderboardEntry[];
  statsByUser: Record<string, PlayerStats>;
}) {
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  return (
    <>
      {leaderboard.map((entry, i) => {
        const isExpanded = expandedUserId === entry.userId;
        const medal = MEDAL_STYLES[entry.rank - 1];
        return (
          <div
            key={entry.userId}
            className={`relative ${
              medal
                ? `after:absolute after:inset-x-3 after:bottom-0 after:h-px after:bg-gradient-to-r ${medal.underline}`
                : i < leaderboard.length - 1
                  ? "border-b border-line"
                  : ""
            }`}
          >
            <button
              type="button"
              onClick={() => setExpandedUserId(isExpanded ? null : entry.userId)}
              className="hover-glow -mx-1 flex w-full items-center gap-2.5 rounded-lg px-1 py-3 text-left"
            >
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-display text-lg ${
                  medal ? medal.badge : "text-ink-faint"
                }`}
              >
                {entry.rank}
              </div>
              <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-line-strong bg-card-hover">
                {entry.userImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={entry.userImage} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center font-condensed text-xs text-ink-dim">
                    {entry.userName.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5 text-[15px] font-semibold">
                  {entry.userName}
                  {entry.rank === 1 && entry.points > 0 && <Star size={13} className="fill-gold text-gold" />}
                </div>
                <div className="text-xs text-ink-dim">
                  {entry.played} predicciones · {entry.exact} exactas
                </div>
              </div>
              <div className="font-display text-2xl text-gold">{entry.points}</div>
            </button>
            {isExpanded && statsByUser[entry.userId] && (
              <div className="pb-3">
                <PlayerStatsPanel stats={statsByUser[entry.userId]} />
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
