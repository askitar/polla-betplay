"use client";

import { useState, useTransition } from "react";
import { Lock, Check, Star, Users, ChevronDown } from "lucide-react";
import { TeamBadge } from "@/components/ui/TeamBadge";
import { ScoreDial } from "@/components/ui/ScoreDial";
import { savePrediction } from "@/app/clubs/[clubId]/partidos/actions";
import { AdminResultForm } from "@/components/match/AdminResultForm";
import { CountdownTimer } from "@/components/match/CountdownTimer";
import { GoalCelebration } from "@/components/match/GoalCelebration";
import type { MatchView } from "@/lib/matches-service";

function fmtDate(iso: Date | string) {
  const d = new Date(iso);
  const datePart = d.toLocaleDateString("es-CO", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
  const timePart = d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
  return `${datePart} · ${timePart}`;
}

export function MatchCard({
  clubId,
  match,
  isAdmin = false,
  favoriteTeamName = null,
}: {
  clubId: string;
  match: MatchView;
  isAdmin?: boolean;
  favoriteTeamName?: string | null;
}) {
  const [draft, setDraft] = useState<{ home: number | null; away: number | null }>({
    home: match.myPrediction?.homeScore ?? null,
    away: match.myPrediction?.awayScore ?? null,
  });
  const [justSaved, setJustSaved] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [showReveal, setShowReveal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const finished = match.status === "FINISHED";
  const complete = draft.home != null && draft.away != null;
  const dirty =
    complete &&
    (!match.myPrediction ||
      match.myPrediction.homeScore !== draft.home ||
      match.myPrediction.awayScore !== draft.away);

  function handleSave() {
    if (draft.home == null || draft.away == null) return;
    setError(null);
    startTransition(async () => {
      try {
        await savePrediction(clubId, match.id, draft.home!, draft.away!);
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 2000);
        setCelebrate(true);
        setTimeout(() => setCelebrate(false), 1400);
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo guardar.");
      }
    });
  }

  const isFavoriteHome = favoriteTeamName != null && match.homeTeam.name === favoriteTeamName;
  const isFavoriteAway = favoriteTeamName != null && match.awayTeam.name === favoriteTeamName;
  const favoritePlayingToday = (isFavoriteHome || isFavoriteAway) && match.isToday && !finished;

  return (
    <div
      className={`ticket-card relative mb-3 p-4 ${
        match.isNext
          ? "border-gold shadow-[0_0_0_1px_rgba(255,199,44,0.25),0_4px_18px_rgba(255,199,44,0.08)]"
          : ""
      }`}
    >
      {celebrate && <GoalCelebration />}

      {match.isNext && (
        <>
          <div className="absolute -top-2.5 left-4 rounded bg-gold px-2 py-0.5 font-condensed text-[11px] font-bold tracking-wide text-pitch">
            PRÓXIMO
          </div>
          {!match.started && <CountdownTimer kickoff={match.kickoff.toISOString()} />}
        </>
      )}

      <div className="mb-3 flex items-center justify-between">
        <div className="text-xs text-ink-dim">{fmtDate(match.kickoff)}</div>
        {match.locked && !finished && (
          <div className="flex items-center gap-1 text-[11px] text-gold-dim">
            <Lock size={11} /> CERRADO
          </div>
        )}
        {finished && <div className="text-[11px] text-ink-faint">FINAL</div>}
      </div>

      {favoritePlayingToday && (
        <div className="mb-3 flex items-center gap-1.5 text-[12px] font-semibold text-gold">
          <Star size={12} className="fill-gold" />
          ¡Hoy juega {favoriteTeamName}!
        </div>
      )}

      {!finished && match.totalMembers > 0 && (
        <div className="mb-3 text-[12px] text-ink-faint">
          {match.predictedCount} de {match.totalMembers}{" "}
          {match.totalMembers === 1 ? "jugador ya puso" : "jugadores ya pusieron"} marcador
        </div>
      )}

      <div className="flex items-center justify-between gap-1.5 sm:gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2">
          <TeamBadge name={match.homeTeam.name} uid={`${match.id}-home`} />
          <span
            className={`min-w-0 text-[13px] leading-tight font-semibold sm:text-sm ${
              isFavoriteHome ? "text-gold" : ""
            }`}
          >
            {match.homeTeam.name}
          </span>
        </div>

        {finished ? (
          <div className="flex items-center gap-2.5 font-display text-[30px]">
            <span>{match.homeScore}</span>
            <span className="text-line-strong">–</span>
            <span>{match.awayScore}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 sm:gap-3.5">
            <ScoreDial
              value={draft.home}
              onChange={(v) => setDraft((d) => ({ ...d, home: v }))}
              disabled={match.locked}
              teamName={match.homeTeam.name}
            />
            <span className="font-display text-line-strong">–</span>
            <ScoreDial
              value={draft.away}
              onChange={(v) => setDraft((d) => ({ ...d, away: v }))}
              disabled={match.locked}
              teamName={match.awayTeam.name}
            />
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-row-reverse items-center gap-1.5 text-right sm:gap-2">
          <TeamBadge name={match.awayTeam.name} uid={`${match.id}-away`} />
          <span
            className={`min-w-0 text-[13px] leading-tight font-semibold sm:text-sm ${
              isFavoriteAway ? "text-gold" : ""
            }`}
          >
            {match.awayTeam.name}
          </span>
        </div>
      </div>

      {!finished && !match.locked && (
        <div className="mt-3 flex flex-col items-center gap-1.5">
          <button
            onClick={handleSave}
            disabled={!complete || pending || (!dirty && !justSaved)}
            className={`${dirty ? "btn-primary" : "btn-secondary"} px-5 py-2 text-[13px] ${
              !complete ? "opacity-45" : ""
            }`}
          >
            {justSaved && !dirty ? (
              <>
                <Check size={14} /> Predicción guardada
              </>
            ) : pending ? (
              "Guardando..."
            ) : !complete ? (
              "Completa el marcador"
            ) : (
              "Guardar predicción"
            )}
          </button>
          {error && <p className="text-xs text-flag-red">{error}</p>}
        </div>
      )}

      {match.selfMissingWarning && (
        <div className="mt-3 rounded-md border border-flag-red/40 bg-flag-red/10 px-3 py-2 text-[12px] text-ink">
          Falta menos de 2 horas y todavía no has hecho tu predicción.
        </div>
      )}

      {finished && match.myPrediction && (
        <div className="mt-2.5 text-xs text-ink-dim">
          Tu predicción: {match.myPrediction.homeScore}–{match.myPrediction.awayScore} ·{" "}
          {match.myPoints === 7
            ? "🎯⭐ exacto y único, +7"
            : match.myPoints === 5
              ? "🎯 exacto, +5"
              : match.myPoints === 3
                ? "✔⚽ ganador y gol acertado, +3"
                : match.myPoints === 2
                  ? "✔ ganador correcto, +2"
                  : match.myPoints === 1
                    ? "⚽ gol acertado, +1"
                    : "sin puntos"}
        </div>
      )}

      {match.missingMemberNames && match.missingMemberNames.length > 0 && (
        <div className="mt-3 border-t border-dashed border-line-strong pt-3">
          <div className="mb-1 text-[11px] tracking-wide text-ink-dim">AÚN FALTAN POR PREDECIR</div>
          <div className="text-[13px] text-ink-dim">{match.missingMemberNames.join(", ")}</div>
        </div>
      )}

      {isAdmin && !finished && <AdminResultForm clubId={clubId} matchId={match.id} />}

      {match.membersReveal && match.membersReveal.length > 0 && (
        <div className="mt-3 border-t border-dashed border-line-strong pt-3">
          <button
            type="button"
            onClick={() => setShowReveal((v) => !v)}
            className="btn-secondary w-full text-[13px]"
          >
            <Users size={14} />
            Predicciones jugadores
            <ChevronDown
              size={14}
              className={`transition-transform ${showReveal ? "rotate-180" : ""}`}
            />
          </button>
          {showReveal && (
            <div className="mt-3 flex flex-col gap-1.5">
              {match.membersReveal.map((mem) => (
                <div key={mem.userId} className="flex justify-between text-[13px]">
                  <span className="text-ink">{mem.userName}</span>
                  <span className="text-ink-dim">
                    {mem.prediction
                      ? `${mem.prediction.homeScore}–${mem.prediction.awayScore}`
                      : "sin predicción"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
