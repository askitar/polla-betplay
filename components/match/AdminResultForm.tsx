"use client";

import { useState, useTransition } from "react";
import { ShieldAlert, Pencil, ChevronDown } from "lucide-react";
import { submitManualResult } from "@/app/clubs/[clubId]/partidos/actions";

/**
 * Lets a club admin override the official final score when the automatic
 * feed gets it wrong. It changes the result for EVERY player in every club,
 * so it is built to be impossible to mistake for the prediction input that
 * sits above it: separate red-tinted panel, explicit wording about what it
 * does, and a second confirmation step before anything is saved. That
 * mix-up is not hypothetical, it is how predictions ended up saved as
 * official results for matches that had not been played.
 */
export function AdminResultForm({
  clubId,
  matchId,
  current = null,
}: {
  clubId: string;
  matchId: string;
  /**
   * The score already saved, when the match is final. Then the form starts
   * folded behind a "corregir" button and prefilled, so an admin who typed a
   * wrong result can fix it without it being in everyone's way.
   */
  current?: { home: number; away: number } | null;
}) {
  const [home, setHome] = useState(current ? String(current.home) : "");
  const [away, setAway] = useState(current ? String(current.away) : "");
  const [open, setOpen] = useState(!current);
  const [confirming, setConfirming] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const complete = home !== "" && away !== "";

  function handleConfirm() {
    if (!complete) return;
    setError(null);
    startTransition(async () => {
      try {
        await submitManualResult(clubId, matchId, Number(home), Number(away));
        setConfirming(false);
        setSaved(`${home}-${away}`);
        if (current) setOpen(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo guardar.");
        setConfirming(false);
      }
    });
  }

  const unchanged = current != null && Number(home) === current.home && Number(away) === current.away;

  if (!open) {
    return (
      <div className="mt-3 border-t border-dashed border-white/10 pt-3">
        <button
          type="button"
          onClick={() => {
            setSaved(null);
            setOpen(true);
          }}
          className="flex w-full items-center justify-between gap-2 rounded-xl px-1 py-1 text-left text-[12px] text-ink-dim transition hover:text-ink"
        >
          <span className="flex items-center gap-1.5">
            <Pencil size={13} className="text-flag-red" />
            Admin: ¿te equivocaste? Corregir el resultado
          </span>
          <ChevronDown size={14} />
        </button>
        {saved && <p className="mt-1 px-1 text-[12px] text-acierto">Listo, el resultado quedó en {saved}.</p>}
      </div>
    );
  }

  return (
    <div className="mt-3.5 rounded-md border border-flag-red/40 bg-flag-red/10 p-3">
      <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-flag-red">
        <ShieldAlert size={13} />
        SOLO ADMIN · CORREGIR RESULTADO OFICIAL
      </div>
      <p className="mb-2.5 text-[11px] leading-snug text-ink-dim">
        Esto NO es tu predicción. Cambia el marcador final del partido para todos los
        jugadores de todos los clubes, hasta que llegue el resultado oficial, que lo reemplaza.
      </p>

      {!confirming ? (
        <div className="flex flex-wrap items-center gap-2.5">
          <input
            type="number"
            min={0}
            placeholder="0"
            value={home}
            onChange={(e) => setHome(e.target.value)}
            className="mini-input"
            aria-label="Goles local, resultado oficial"
          />
          <span className="text-ink-faint">-</span>
          <input
            type="number"
            min={0}
            placeholder="0"
            value={away}
            onChange={(e) => setAway(e.target.value)}
            className="mini-input"
            aria-label="Goles visitante, resultado oficial"
          />
          <button
            onClick={() => setConfirming(true)}
            disabled={!complete || unchanged}
            className="btn-secondary px-3 py-1.5 text-xs"
          >
            Corregir resultado
          </button>
          {current && (
            <button onClick={() => setOpen(false)} className="text-xs text-ink-faint hover:text-ink">
              Cerrar
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-[12px] text-ink">
            ¿Fijar el resultado oficial en <b>{home}-{away}</b> para todos?
          </span>
          <button
            onClick={handleConfirm}
            disabled={pending}
            className="btn-primary px-3 py-1.5 text-xs"
          >
            {pending ? "Guardando..." : "Sí, fijar"}
          </button>
          <button
            onClick={() => setConfirming(false)}
            disabled={pending}
            className="btn-secondary px-3 py-1.5 text-xs"
          >
            Cancelar
          </button>
        </div>
      )}
      {error && <p className="mt-1.5 text-xs text-flag-red">{error}</p>}
      {saved && !current && <p className="mt-1.5 text-xs text-acierto">Listo, el resultado quedó en {saved}.</p>}
    </div>
  );
}
