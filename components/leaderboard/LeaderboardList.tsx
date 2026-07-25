"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { PlayerStatsPanel } from "@/components/leaderboard/PlayerStatsPanel";
import type { LeaderboardEntry } from "@/lib/leaderboard-service";
import type { PlayerStats } from "@/lib/player-stats-service";

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
        return (
          <div key={entry.userId} className={i < leaderboard.length - 1 ? "border-b border-line" : ""}>
            <button
              type="button"
              onClick={() => setExpandedUserId(isExpanded ? null : entry.userId)}
              className="flex w-full items-center gap-2.5 py-3 text-left"
            >
              <div
                className={`w-7 text-center font-display text-lg ${
                  i === 0 ? "text-gold" : "text-ink-faint"
                }`}
              >
                {i + 1}
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
                  {i === 0 && entry.points > 0 && <Star size={13} className="fill-gold text-gold" />}
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
