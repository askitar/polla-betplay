"use client";

import { useState } from "react";
import { COLOMBIA_TIME_ZONE } from "@/lib/match-time";
import { Target, CircleCheck, Circle, Star } from "lucide-react";
import { TeamBadge } from "@/components/ui/TeamBadge";
import { POINTS } from "@/lib/scoring";
import type { PlayerStats } from "@/lib/player-stats-service";

function fmtDate(iso: Date | string) {
  return new Date(iso).toLocaleDateString("es-CO", { timeZone: COLOMBIA_TIME_ZONE, day: "2-digit", month: "short" });
}

function SummaryRow({
  icon,
  label,
  count,
  rule,
  subtotal,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  rule: number;
  subtotal: number;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 border-b border-white/[0.06] py-2 text-[13px] last:border-b-0">
      <span className="flex items-center gap-1.5">
        {icon}
        {label}
      </span>
      <span className="w-10 text-right text-ink-dim">{count}</span>
      <span className="w-10 text-right text-ink-faint">x{rule}</span>
      <span className="w-10 text-right font-display text-base text-gold">{subtotal}</span>
    </div>
  );
}

export function PlayerStatsPanel({ stats }: { stats: PlayerStats }) {
  const [tab, setTab] = useState<"resumen" | "detalles">("resumen");
  const { summary, matches } = stats;

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-black/30 p-3">
      <div className="seg mb-3">
        <button type="button" onClick={() => setTab("resumen")} className="seg-item" data-active={tab === "resumen"}>
          Resumen
        </button>
        <button type="button" onClick={() => setTab("detalles")} className="seg-item" data-active={tab === "detalles"}>
          Partido a partido
        </button>
      </div>

      {matches.length === 0 ? (
        <p className="py-2 text-xs text-ink-faint">Aún no tiene predicciones en partidos jugados o en vivo.</p>
      ) : tab === "resumen" ? (
        <div>
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 pb-1.5 font-condensed text-[10px] tracking-[0.12em] text-ink-faint">
            <span>CONCEPTO</span>
            <span className="w-10 text-right">VECES</span>
            <span className="w-10 text-right">REGLA</span>
            <span className="w-10 text-right">PTS</span>
          </div>
          <SummaryRow
            icon={<Target size={13} className="text-flag-red" />}
            label="Marcador exacto"
            count={summary.exactCount}
            rule={POINTS.EXACT}
            subtotal={summary.exactSubtotal}
          />
          <SummaryRow
            icon={<CircleCheck size={13} className="text-flag-blue" />}
            label="Ganador o empate"
            count={summary.winnerCount}
            rule={POINTS.WINNER}
            subtotal={summary.winnerSubtotal}
          />
          <SummaryRow
            icon={<Circle size={13} className="text-acierto" />}
            label="Gol acertado"
            count={summary.goalCount}
            rule={POINTS.GOAL}
            subtotal={summary.goalSubtotal}
          />
          <SummaryRow
            icon={<Star size={13} className="fill-gold text-gold" />}
            label="Predicción única"
            count={summary.uniqueCount}
            rule={POINTS.UNIQUE_BONUS}
            subtotal={summary.uniqueSubtotal}
          />
          <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2.5">
            <span className="text-[13px] font-semibold">Puntaje total</span>
            <span className="num-gold font-display text-2xl">{summary.total}</span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {matches.map((m) => (
            <div key={m.matchId} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
              <div className="mb-1.5 flex items-center justify-between">
                {m.isLive ? (
                  <span className="chip chip-red">
                    <span className="live-dot" /> En vivo · provisional
                  </span>
                ) : (
                  <span className="text-[11px] text-ink-faint">{fmtDate(m.kickoff)}</span>
                )}
                <span className={`chip ${m.points > 0 ? "chip-green" : ""}`}>+{m.points}</span>
              </div>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <div className="flex flex-1 items-center gap-1.5">
                  <TeamBadge name={m.homeTeam} uid={`${m.matchId}-stat-home`} size={22} />
                  <span className="min-w-0 truncate text-[13px]">{m.homeTeam}</span>
                </div>
                <span className="font-display text-lg">
                  {m.homeScore}–{m.awayScore}
                </span>
                <div className="flex flex-1 flex-row-reverse items-center gap-1.5 text-right">
                  <TeamBadge name={m.awayTeam} uid={`${m.matchId}-stat-away`} size={22} />
                  <span className="min-w-0 truncate text-[13px]">{m.awayTeam}</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-ink-dim">
                <span>
                  Predijo {m.predictionHome}–{m.predictionAway}
                </span>
                <span className="flex items-center gap-2">
                  <Target size={12} className={m.exact ? "text-flag-red" : "text-line-strong"} />
                  <CircleCheck size={12} className={m.winner ? "text-flag-blue" : "text-line-strong"} />
                  <Circle size={12} className={m.goal ? "text-acierto" : "text-line-strong"} />
                  <Star size={12} className={m.uniqueBonus ? "fill-gold text-gold" : "text-line-strong"} />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
