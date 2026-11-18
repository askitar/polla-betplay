"use client";

import { useState, useTransition } from "react";
import { Swords, Check, X, ShieldAlert } from "lucide-react";
import { GlassIcon } from "@/components/ui/GlassIcon";
import { decidePlayoffs } from "@/app/clubs/[clubId]/torneo-actions";

/**
 * The cuadrangulares invitation. Two shapes:
 * - "undecided": the big card everyone sees on entering until they answer.
 * - "declined": a slim banner, so a "no" by mistake can still become a yes.
 * Saying yes goes through one confirmation, because it cannot be undone.
 */
export function PlayoffInviteCard({
  clubId,
  mode,
  participants,
}: {
  clubId: string;
  mode: "undecided" | "declined";
  participants: number;
}) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function decide(accept: boolean) {
    setError(null);
    startTransition(async () => {
      try {
        await decidePlayoffs(clubId, accept);
        setConfirming(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo guardar.");
      }
    });
  }

  const confirmBox = (
    <div className="mt-4 rounded-2xl border border-gold/40 bg-gold/10 p-3.5">
      <div className="flex items-start gap-2 text-[13px] leading-snug text-ink">
        <ShieldAlert size={16} className="mt-0.5 shrink-0 text-gold" />
        <span>
          Una vez entras, quedas en la tabla de los cuadrangulares hasta la final y ya no te puedes
          salir. ¿Confirmas?
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={() => decide(true)} disabled={pending} className="btn-primary px-5 py-2.5 text-[13px]">
          <Check size={14} /> {pending ? "Guardando..." : "Sí, confirmo"}
        </button>
        <button onClick={() => setConfirming(false)} disabled={pending} className="btn-secondary px-5 py-2.5 text-[13px]">
          Volver
        </button>
      </div>
    </div>
  );

  if (mode === "declined") {
    return (
      <div className="card rise mb-5">
        <div className="flex flex-wrap items-center gap-3">
          <GlassIcon icon={Swords} tint="gold" size="sm" />
          <p className="min-w-0 flex-1 text-[13px] leading-snug text-ink-dim">
            Dijiste que no a los cuadrangulares.{" "}
            <span className="text-ink">¿Cambiaste de opinión?</span> Todavía puedes entrar.
          </p>
          {!confirming && (
            <button onClick={() => setConfirming(true)} className="btn-primary px-4 py-2 text-[13px]">
              Quiero participar
            </button>
          )}
        </div>
        {confirming && confirmBox}
        {error && <p className="mt-2 text-xs text-flag-red">{error}</p>}
      </div>
    );
  }

  return (
    <div className="ticket-card rise relative mb-6 overflow-hidden border-gold/60 p-5 shadow-[0_0_0_1px_rgb(var(--accent-rgb)/0.3),0_24px_60px_-18px_rgb(var(--accent-rgb)/0.55)] sm:p-6">
      <span className="glare" aria-hidden />
      <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-gold/25 blur-3xl" />
      <div className="relative flex items-start gap-4">
        <GlassIcon icon={Swords} tint="gold" size="lg" />
        <div className="min-w-0 flex-1">
          <div className="eyebrow">NUEVO TORNEO</div>
          <h2 className="mt-0.5 font-display text-[30px] leading-[1.05] sm:text-4xl">
            ¡Empiezan los cuadrangulares!
          </h2>
          <p className="mt-2 text-[13.5px] leading-snug text-ink-dim">
            Una polla nueva que arranca <span className="text-ink">desde cero</span>, con las mismas
            reglas de siempre: 5 por el marcador exacto, 2 por el ganador o el empate, 1 por los
            goles de un equipo y +2 si eres el único con el exacto. Van los 2 grupos de 4 y la final.
          </p>
          <p className="mt-2 text-[12px] text-ink-faint">
            {participants === 0
              ? "Todavía nadie se ha inscrito. ¡Sé el primero!"
              : `${participants} ${participants === 1 ? "ya se inscribió" : "ya se inscribieron"}.`}
          </p>
        </div>
      </div>

      <div className="relative mt-4 text-center font-display text-xl sm:text-left">¿Quieres participar?</div>
      {!confirming ? (
        <div className="relative mt-3 grid grid-cols-2 gap-2.5 sm:flex">
          <button onClick={() => setConfirming(true)} disabled={pending} className="btn-primary px-6 py-3 text-[14px]">
            <Check size={15} /> Sí, quiero jugar
          </button>
          <button onClick={() => decide(false)} disabled={pending} className="btn-secondary px-6 py-3 text-[14px]">
            <X size={15} /> No, gracias
          </button>
        </div>
      ) : (
        confirmBox
      )}
      {error && <p className="relative mt-2 text-xs text-flag-red">{error}</p>}
    </div>
  );
}
