"use client";

import { useState } from "react";
import { Target, CircleCheck, Circle, Star } from "lucide-react";
import { TeamBadge } from "@/components/ui/TeamBadge";
import { POINTS } from "@/lib/scoring";
import type { PlayerStats } from "@/lib/player-stats-service";

function fmtDate(iso: Date | string) {
  return new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "short" });
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
    <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2 border-b border-line py-2 text-[13px] last:border-b-0">
      <span className="flex items-center gap-1.5">
        {icon}
        {label}
      </span>
      <span className="text-right text-ink-dim">{count}</span>
      <span className="text-right text-ink-dim">{rule}</span>
      <span className="text-right font-semibold text-gold">{subtotal}</span>
    </div>
  );
}

export function PlayerStatsPanel({ stats }: { stats: PlayerStats }) {
  const [tab, setTab] = useState<"resumen" | "detalles">("resumen");
  const { summary, matches } = stats;

  return (
    <div className="rounded-lg border border-line bg-pitch/40 p-3">
      <div className="mb-3 flex gap-1.5">
        <button
          type="button"
          onClick={() => setTab("resumen")}
          className={`rounded px-3 py-1.5 font-condensed text-[12px] font-semibold tracking-wide ${
            tab === "resumen" ? "bg-gold text-pitch" : "border border-line-strong text-ink-dim"
          }`}
        >
          RESUMEN
        </button>
        <button
          type="button"
          onClick={() => setTab("detalles")}
          className={`rounded px-3 py-1.5 font-condensed text-[12px] font-semibold tracking-wide ${
            tab === "detalles" ? "bg-gold text-pitch" : "border border-line-strong text-ink-dim"
          }`}
        >
          DETALLES
        </button>
      </div>

      {matches.length === 0 ? (
        <p className="py-2 text-xs text-ink-faint">Aún no tiene predicciones en partidos jugados o en vivo.</p>
      ) : tab === "resumen" ? (
        <div>
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 pb-1.5 text-[10px] tracking-wide text-ink-faint">
            <span>CONCEPTO</span>
            <span className="text-right">ACIERTOS</span>
            <span className="text-right">REGLA</span>
            <span className="text-right">SUBTOTAL</span>
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
          <div className="mt-1.5 flex items-center justify-between border-t border-line-strong pt-2">
            <span className="text-[13px] font-semibold">Puntaje total</span>
            <span className="font-display text-xl text-gold">{summary.total}</span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {matches.map((m) => (
            <div key={m.matchId} className="rounded-md border border-line px-3 py-2.5">
              <div className="mb-1.5 flex items-center justify-between">
                {m.isLive ? (
                  <span className="flex items-center gap-1.5 text-[11px] font-bold text-flag-red">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-flag-red opacity-75" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-flag-red" />
                    </span>
                    EN VIVO · provisional
                  </span>
                ) : (
                  <span className="text-[11px] text-ink-faint">{fmtDate(m.kickoff)}</span>
                )}
                <span
                  className={`rounded px-1.5 py-0.5 font-display text-sm ${
                    m.points > 0 ? "bg-acierto/20 text-acierto" : "bg-line text-ink-faint"
                  }`}
                >
                  +{m.points}
                </span>
              </div>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <div className="flex flex-1 items-center gap-1.5">
                  <TeamBadge name={m.homeTeam} uid={`${m.matchId}-stat-home`} size={22} />
                  <span className="min-w-0 truncate text-[13px]">{m.homeTeam}</span>
                </div>
                <span className="font-display text-base">
                  {m.homeScore}–{m.awayScore}
                </span>
                <div className="flex flex-1 flex-row-reverse items-center gap-1.5 text-right">
                  <TeamBadge name={m.awayTeam} uid={`${m.matchId}-stat-away`} size={22} />
                  <span className="min-w-0 truncate text-[13px]">{m.awayTeam}</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-ink-dim">
                <span>
                  Predicción: {m.predictionHome}–{m.predictionAway}
                </span>
                <span className="flex items-center gap-2">
                  <Target size={12} className={m.exact ? "text-flag-red" : "text-line-strong"} />
                  <CircleCheck size={12} className={m.winner ? "text-flag-blue" : "text-line-strong"} />
                  <Circle size={12} className={m.goal ? "text-acierto" : "text-line-strong"} />
                  <Star
                    size={12}
                    className={m.uniqueBonus ? "fill-gold text-gold" : "text-line-strong"}
                  />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
