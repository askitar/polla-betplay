"use client";

import { useState } from "react";
import { Lock, ChevronRight } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { TeamBadge } from "@/components/ui/TeamBadge";
import { ScoreDial } from "@/components/ui/ScoreDial";
import { TicketDivider } from "@/components/ui/TicketDivider";

export default function DesignPreviewPage() {
  const [home, setHome] = useState<number | null>(2);
  const [away, setAway] = useState<number | null>(1);

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-5 py-10">
      <Logo />
      <p className="mt-2 mb-8 text-[15px] leading-relaxed text-ink-dim">
        Vista previa del sistema de diseño (temporal, se reemplaza por el landing real).
      </p>

      <SectionLabel>Próximo partido</SectionLabel>
      <div className="ticket-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-xs text-ink-dim">jue · 24 jul · 6:10 p.m.</div>
          <div className="flex items-center gap-1 text-[11px] text-gold-dim">
            <Lock size={11} /> CIERRA PRONTO
          </div>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-1 items-center gap-2">
            <TeamBadge name="Millonarios" uid="preview-home" />
            <span className="text-sm font-semibold">Millonarios</span>
          </div>
          <div className="flex items-center gap-3.5">
            <ScoreDial value={home} onChange={setHome} teamName="Millonarios" />
            <span className="font-display text-line-strong">–</span>
            <ScoreDial value={away} onChange={setAway} teamName="Junior" />
          </div>
          <div className="flex flex-1 flex-row-reverse items-center gap-2 text-right">
            <TeamBadge name="Junior" uid="preview-away" />
            <span className="text-sm font-semibold">Junior</span>
          </div>
        </div>
        <div className="mt-3 flex justify-center">
          <button className="btn-primary">Guardar predicción</button>
        </div>
      </div>

      <TicketDivider />

      <SectionLabel>Botones y campos</SectionLabel>
      <div className="card flex flex-col gap-3">
        <input className="input-field" placeholder="Tu nombre" />
        <button className="btn-primary w-full">
          Continuar <ChevronRight size={16} />
        </button>
        <button className="btn-secondary w-full">Unirme al club</button>
      </div>
    </main>
  );
}
