import Link from "next/link";
import { Trophy, Flag } from "lucide-react";
import type { CSSProperties } from "react";
import { GlassIcon } from "@/components/ui/GlassIcon";
import { COLOMBIA_TIME_ZONE } from "@/lib/match-time";
import type { PollaProgress } from "@/lib/season";

export function PollaProgressCard({
  clubId,
  progress,
}: {
  clubId: string;
  progress: PollaProgress;
}) {
  const { currentFecha, totalFechas, totalMatches, finished, remaining, live, postponed, lastKickoff } =
    progress;
  const percent = totalMatches > 0 ? Math.round((finished / totalMatches) * 100) : 0;

  if (progress.isOver) {
    return (
      <div className="card rise mb-5 flex items-center gap-4">
        <GlassIcon icon={Trophy} size="lg" />
        <div className="min-w-0">
          <div className="eyebrow">ASÍ VA LA POLLA</div>
          <div className="mt-0.5 font-display text-2xl leading-tight">¡La polla terminó!</div>
          <p className="mt-1 text-[13px] leading-snug text-ink-dim">
            Se jugaron las {totalFechas} fechas del todos contra todos. Los cuadrangulares y la
            final se juegan aparte, en una tabla nueva desde cero.
          </p>
          <Link
            href={`/clubs/${clubId}/clasificacion`}
            className="mt-2 inline-block text-[13px] font-semibold text-gold"
          >
            Ver la tabla final
          </Link>
        </div>
      </div>
    );
  }

  const details = [
    postponed > 0 ? `${postponed} ${postponed === 1 ? "aplazado" : "aplazados"}` : null,
    lastKickoff
      ? `cierra el ${lastKickoff.toLocaleDateString("es-CO", {
          timeZone: COLOMBIA_TIME_ZONE,
          weekday: "short",
          day: "numeric",
          month: "short",
        })}`
      : null,
  ].filter(Boolean);

  return (
    <div className="card rise mb-5 flex items-center gap-4 sm:gap-6">
      <div className="ring" style={{ "--p": percent } as CSSProperties} aria-hidden>
        <div className="flex h-full w-full flex-col items-center justify-center">
          <span className="num-gold font-display text-[26px] leading-none">{remaining}</span>
          <span className="font-condensed text-[9px] tracking-[0.14em] text-ink-dim">QUEDAN</span>
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="eyebrow">ASÍ VA LA POLLA</span>
          {live > 0 && (
            <span className="chip chip-red">
              <span className="live-dot" /> {live} en vivo
            </span>
          )}
        </div>
        <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2">
          <span className="font-display text-[26px] leading-tight sm:text-3xl">
            Fecha {currentFecha}
            <span className="text-ink-faint"> / {totalFechas}</span>
          </span>
          <span className="text-[12px] text-ink-dim">
            {remaining} {remaining === 1 ? "partido" : "partidos"} para terminar
          </span>
        </div>
        <div className="mt-1.5 text-[11.5px] text-ink-faint">
          {finished} de {totalMatches} jugados · {percent}%
          {details.length > 0 ? ` · ${details.join(" · ")}` : ""}
        </div>
        <p className="mt-2 flex items-start gap-1.5 text-[12px] leading-snug text-ink-dim">
          <Flag size={12} className="mt-0.5 shrink-0 text-gold-dim" />
          <span>
            Esta tabla va hasta el final del todos contra todos ({totalFechas} fechas). Los
            cuadrangulares tienen su propia polla, desde cero.
          </span>
        </p>
      </div>
    </div>
  );
}
