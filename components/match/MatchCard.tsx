"use client";

import { useState, useTransition } from "react";
import {
  Lock,
  Check,
  Star,
  Users,
  ChevronDown,
  CalendarClock,
  Target,
  CircleCheck,
  Circle,
  AlertTriangle,
  ClipboardCheck,
  X,
} from "lucide-react";
import { TeamBadge } from "@/components/ui/TeamBadge";
import { ScoreDial } from "@/components/ui/ScoreDial";
import { Tilt } from "@/components/ui/Tilt";
import { savePrediction } from "@/app/clubs/[clubId]/partidos/actions";
import { AdminResultForm } from "@/components/match/AdminResultForm";
import { CountdownTimer } from "@/components/match/CountdownTimer";
import { GoalCelebration } from "@/components/match/GoalCelebration";
import { COLOMBIA_TIME_ZONE } from "@/lib/match-time";
import type { MatchView } from "@/lib/matches-service";

function fmtDate(iso: Date | string) {
  const d = new Date(iso);
  const datePart = d.toLocaleDateString("es-CO", {
    timeZone: COLOMBIA_TIME_ZONE,
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
  const timePart = d.toLocaleTimeString("es-CO", {
    timeZone: COLOMBIA_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${datePart} · ${timePart}`;
}

const LIVE_PERIOD_LABELS: Record<string, string> = {
  "First half": "Primer tiempo",
  "Half time": "Entretiempo",
  Halftime: "Entretiempo",
  "Second half": "Segundo tiempo",
  "Extra time": "Tiempo extra",
  Penalties: "Penales",
  Interrupted: "Interrumpido",
  Suspended: "Suspendido",
};

function fmtLivePeriod(period: string | null, minute: number | null) {
  const label = (period && LIVE_PERIOD_LABELS[period]) || period || "En vivo";
  return minute != null ? `${label} · ${minute}'` : label;
}

function PointsOutcome({ points }: { points: number | null }) {
  if (points === 7)
    return (
      <span className="chip chip-gold">
        <Target size={11} /> <Star size={11} className="fill-current" /> Exacto y único · +7
      </span>
    );
  if (points === 5)
    return (
      <span className="chip chip-gold">
        <Target size={11} /> Exacto · +5
      </span>
    );
  if (points === 3)
    return (
      <span className="chip chip-green">
        <CircleCheck size={11} /> Ganador y gol · +3
      </span>
    );
  if (points === 2)
    return (
      <span className="chip chip-green">
        <CircleCheck size={11} /> Ganador · +2
      </span>
    );
  if (points === 1)
    return (
      <span className="chip chip-green">
        <Circle size={11} /> Gol acertado · +1
      </span>
    );
  return <span className="chip">Sin puntos</span>;
}

export function MatchCard({
  clubId,
  match,
  isAdmin = false,
  favoriteTeamName = null,
  showJornada = false,
  stageLabel = null,
  canPredict = true,
  index = 0,
}: {
  clubId: string;
  match: MatchView;
  isAdmin?: boolean;
  favoriteTeamName?: string | null;
  showJornada?: boolean;
  /** Replaces "Fecha N" when given, e.g. "Grupo A · Fecha 2" or "Final · ida". */
  stageLabel?: string | null;
  /** False for someone who has not joined the cuadrangulares: they can look, not predict. */
  canPredict?: boolean;
  /** Position in its list, for the staggered entrance. */
  index?: number;
}) {
  const [draft, setDraft] = useState<{ home: number | null; away: number | null }>({
    home: match.myPrediction?.homeScore ?? null,
    away: match.myPrediction?.awayScore ?? null,
  });
  // What the server last confirmed. Kept locally too so the card reflects a
  // save immediately, even on a page whose data has not been refreshed yet.
  const [savedPrediction, setSavedPrediction] = useState(match.myPrediction);
  const [celebrate, setCelebrate] = useState(false);
  const [showReveal, setShowReveal] = useState(false);
  const [showRoster, setShowRoster] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const finished = match.status === "FINISHED";
  const complete = draft.home != null && draft.away != null;
  const dirty =
    complete &&
    (!savedPrediction ||
      savedPrediction.homeScore !== draft.home ||
      savedPrediction.awayScore !== draft.away);

  function handleSave() {
    if (draft.home == null || draft.away == null) return;
    setError(null);
    startTransition(async () => {
      try {
        await savePrediction(clubId, match.id, draft.home!, draft.away!);
        setSavedPrediction({ homeScore: draft.home!, awayScore: draft.away! });
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
    <Tilt className="rise mb-3.5" style={{ "--i": Math.min(index, 8) } as React.CSSProperties}>
      <div
        className={`ticket-card relative p-4 sm:p-5 ${
          match.isNext
            ? "border-gold/70 shadow-[0_0_0_1px_rgb(var(--accent-rgb)/0.3),0_18px_50px_-14px_rgb(var(--accent-rgb)/0.35)]"
            : match.live
              ? "border-flag-red/40 shadow-[0_0_0_1px_rgba(255,77,94,0.2),0_18px_50px_-14px_rgba(255,77,94,0.3)]"
              : ""
        }`}
      >
        <span className="glare" aria-hidden />
        {celebrate && <GoalCelebration />}

        {match.isNext && (
          <>
            <div className="absolute -top-3 left-4 rounded-full bg-gradient-to-b from-gold-bright to-gold px-2.5 py-0.5 font-condensed text-[11px] font-bold tracking-[0.12em] text-on-accent shadow-[0_6px_16px_-6px_rgb(var(--accent-rgb)/0.8)]">
              PRÓXIMO
            </div>
            {!match.started && <CountdownTimer kickoff={match.kickoff.toISOString()} />}
          </>
        )}

        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2 text-xs text-ink-dim">
            {stageLabel ? (
              <span className="chip chip-gold">{stageLabel}</span>
            ) : (
              showJornada && <span className="chip chip-gold">Fecha {match.jornadaNumber}</span>
            )}
            <span className="truncate">
              {match.postponed
                ? "Nueva fecha por confirmar"
                : match.live
                  ? fmtLivePeriod(match.livePeriod, match.liveMinute)
                  : fmtDate(match.kickoff)}
            </span>
          </div>
          {match.live && (
            <span className="chip chip-red">
              <span className="live-dot" /> En vivo
            </span>
          )}
          {match.postponed && (
            <span className="chip">
              <CalendarClock size={11} /> Aplazado
            </span>
          )}
          {match.locked && !finished && !match.postponed && !match.live && (
            <span className="chip">
              <Lock size={11} /> Cerrado
            </span>
          )}
          {finished && <span className="chip">Final</span>}
        </div>

        {match.postponed && (
          <div className="mb-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[12px] text-ink-dim">
            Este partido fue aplazado. Las predicciones siguen abiertas hasta que se confirme la
            nueva fecha.
          </div>
        )}

        {favoritePlayingToday && (
          <div className="mb-3 flex items-center gap-1.5 text-[12px] font-semibold text-gold">
            <Star size={12} className="fill-gold" />
            ¡Hoy juega {favoriteTeamName}!
          </div>
        )}

        {!finished && match.totalMembers > 0 && (
          <div className="mb-3 flex items-center gap-2 text-[12px] text-ink-faint">
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
              <span
                className="block h-full rounded-full bg-gradient-to-r from-gold-dim to-gold"
                style={{ width: `${Math.round((match.predictedCount / match.totalMembers) * 100)}%` }}
              />
            </span>
            <span className="shrink-0">
              {match.predictedCount}/{match.totalMembers} ya predijeron
            </span>
          </div>
        )}

        <div className="flex items-center justify-between gap-1.5 sm:gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-2.5">
            <TeamBadge name={match.homeTeam.name} uid={`${match.id}-home`} size={38} />
            <span
              className={`min-w-0 text-[13px] font-semibold leading-tight sm:text-[15px] ${
                isFavoriteHome ? "text-gold" : ""
              }`}
            >
              {match.homeTeam.name}
            </span>
          </div>

          {finished || match.live ? (
            <div className="flex items-center gap-3 font-display text-[38px] leading-none sm:text-[44px]">
              <span className={match.live ? "num-ink" : "num-gold"}>{match.homeScore}</span>
              <span className="text-xl text-line-strong">–</span>
              <span className={match.live ? "num-ink" : "num-gold"}>{match.awayScore}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-4">
              <ScoreDial
                value={draft.home}
                onChange={(v) => setDraft((d) => ({ ...d, home: v }))}
                disabled={match.locked || !canPredict}
                teamName={match.homeTeam.name}
              />
              <span className="font-display text-xl text-line-strong">–</span>
              <ScoreDial
                value={draft.away}
                onChange={(v) => setDraft((d) => ({ ...d, away: v }))}
                disabled={match.locked || !canPredict}
                teamName={match.awayTeam.name}
              />
            </div>
          )}

          <div className="flex min-w-0 flex-1 flex-row-reverse items-center gap-2 text-right sm:gap-2.5">
            <TeamBadge name={match.awayTeam.name} uid={`${match.id}-away`} size={38} />
            <span
              className={`min-w-0 text-[13px] font-semibold leading-tight sm:text-[15px] ${
                isFavoriteAway ? "text-gold" : ""
              }`}
            >
              {match.awayTeam.name}
            </span>
          </div>
        </div>

        {!finished && !match.locked && !canPredict && (
          <p className="mt-4 text-center text-[12px] text-ink-dim">
            Únete a los cuadrangulares (arriba) para poner tu marcador.
          </p>
        )}

        {!finished && !match.locked && canPredict && (
          <div className="mt-4 flex flex-col items-center gap-1.5">
            {dirty ? (
              <button onClick={handleSave} disabled={pending} className="btn-primary px-6 py-2.5 text-[13px]">
                {pending ? "Guardando..." : savedPrediction ? "Guardar el cambio" : "Guardar predicción"}
              </button>
            ) : savedPrediction ? (
              // Already saved and unchanged. This used to be a greyed-out
              // "Guardar predicción", which read as "blocked"; say what is
              // actually going on instead.
              <>
                <span className="btn-secondary btn-saved pointer-events-none px-5 py-2 text-[13px]">
                  <Check size={14} /> Tu predicción está guardada: {savedPrediction.homeScore}–
                  {savedPrediction.awayScore}
                </span>
                <span className="text-[11px] text-ink-faint">Mueve las flechas si quieres cambiarla.</span>
              </>
            ) : (
              <button disabled className="btn-secondary px-6 py-2.5 text-[13px] opacity-50">
                Completa el marcador
              </button>
            )}
            {error && <p className="text-xs text-flag-red">{error}</p>}
          </div>
        )}

        {/* Admin only: who already has a prediction in and who does not, by
            name and never by score, so they can tell "did it save?" apart
            from "did they not do it?" without peeking at anyone's pick. */}
        {isAdmin && !finished && match.totalMembers > 0 && (
          <div className="mt-3 border-t border-dashed border-white/10 pt-3">
            <button
              type="button"
              onClick={() => setShowRoster((v) => !v)}
              className="flex w-full items-center justify-between gap-2 rounded-xl px-1 py-1 text-left text-[12px] text-ink-dim transition hover:text-ink"
            >
              <span className="flex items-center gap-1.5">
                <ClipboardCheck size={13} className="text-gold-dim" />
                Admin: quién ya predijo ({match.predictedCount}/{match.totalMembers})
              </span>
              <ChevronDown
                size={14}
                className={`transition-transform duration-300 ${showRoster ? "rotate-180" : ""}`}
              />
            </button>
            {showRoster && (
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <div className="rounded-xl bg-white/[0.04] p-2.5">
                  <div className="mb-1.5 font-condensed text-[10.5px] tracking-[0.12em] text-acierto">
                    YA PUSIERON ({match.predictedMemberNames.length})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {match.predictedMemberNames.length === 0 && (
                      <span className="text-[12px] text-ink-faint">Nadie todavía.</span>
                    )}
                    {match.predictedMemberNames.map((n) => (
                      <span key={n} className="chip chip-green normal-case tracking-normal">
                        <Check size={11} /> {n}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl bg-white/[0.04] p-2.5">
                  <div className="mb-1.5 font-condensed text-[10.5px] tracking-[0.12em] text-flag-red">
                    FALTAN ({match.pendingMemberNames.length})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {match.pendingMemberNames.length === 0 && (
                      <span className="text-[12px] text-ink-faint">Nadie, todos pusieron.</span>
                    )}
                    {match.pendingMemberNames.map((n) => (
                      <span key={n} className="chip chip-red normal-case tracking-normal">
                        <X size={11} /> {n}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {match.selfMissingWarning && canPredict && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-flag-red/40 bg-flag-red/10 px-3 py-2 text-[12px] text-ink">
            <AlertTriangle size={14} className="shrink-0 text-flag-red" />
            Falta menos de 2 horas y todavía no has hecho tu predicción.
          </div>
        )}

        {finished && match.myPrediction && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-dashed border-white/10 pt-3 text-xs text-ink-dim">
            <span>
              Tu predicción{" "}
              <span className="font-display text-base text-ink">
                {match.myPrediction.homeScore}–{match.myPrediction.awayScore}
              </span>
            </span>
            <PointsOutcome points={match.myPoints} />
          </div>
        )}

        {match.missingMemberNames && match.missingMemberNames.length > 0 && (
          <div className="mt-3 border-t border-dashed border-white/10 pt-3">
            <div className="mb-1 font-condensed text-[11px] tracking-[0.12em] text-ink-dim">
              AÚN FALTAN POR PREDECIR
            </div>
            <div className="text-[13px] text-ink-dim">{match.missingMemberNames.join(", ")}</div>
          </div>
        )}

        {/* Only once the match could actually be over. Showing it under the
            prediction dials on every upcoming match is what let predictions
            get typed into it by mistake and saved as official results. */}
        {isAdmin && !finished && match.resultEntryOpen && (
          <AdminResultForm clubId={clubId} matchId={match.id} />
        )}

        {match.membersReveal && match.membersReveal.length > 0 && (
          <div className="mt-3 border-t border-dashed border-white/10 pt-3">
            <button
              type="button"
              onClick={() => setShowReveal((v) => !v)}
              className="btn-secondary w-full text-[13px]"
            >
              <Users size={14} />
              Predicciones de los jugadores
              <ChevronDown
                size={14}
                className={`transition-transform duration-300 ${showReveal ? "rotate-180" : ""}`}
              />
            </button>
            {showReveal && (
              <div className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {match.membersReveal.map((mem) => (
                  <div
                    key={mem.userId}
                    className="flex items-center justify-between rounded-lg bg-white/[0.04] px-3 py-2 text-[13px]"
                  >
                    <span className="truncate text-ink">{mem.userName}</span>
                    <span className="font-display text-base text-ink-dim">
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
    </Tilt>
  );
}
