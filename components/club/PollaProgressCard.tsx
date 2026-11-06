import Link from "next/link";
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
      <div className="card mb-5">
        <div className="eyebrow">ASÍ VA LA POLLA</div>
        <div className="mt-1 font-display text-2xl leading-tight">¡La polla terminó!</div>
        <p className="mt-1.5 text-[13px] leading-snug text-ink-dim">
          Ya se jugaron las {totalFechas} fechas del todos contra todos, que es hasta donde va la
          polla. Lo que sigue en la liga (los 8 clasificados, fase de grupos y final) no cuenta.
        </p>
        <Link
          href={`/clubs/${clubId}/clasificacion`}
          className="mt-2.5 inline-block text-[13px] font-semibold text-gold"
        >
          Ver la tabla final
        </Link>
      </div>
    );
  }

  const details = [
    live > 0 ? `${live} en vivo` : null,
    postponed > 0 ? `${postponed} ${postponed === 1 ? "aplazado sin fecha" : "aplazados sin fecha"}` : null,
    lastKickoff
      ? `último partido: ${lastKickoff.toLocaleDateString("es-CO", {
          timeZone: COLOMBIA_TIME_ZONE,
          weekday: "short",
          day: "numeric",
          month: "short",
        })}`
      : null,
  ].filter(Boolean);

  return (
    <div className="card mb-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="eyebrow">ASÍ VA LA POLLA</div>
          <div className="mt-1 font-display text-2xl leading-tight">
            Fecha {currentFecha} de {totalFechas}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="font-display text-2xl leading-tight text-gold">{remaining}</div>
          <div className="text-[11px] leading-tight text-ink-dim">
            {remaining === 1 ? "partido queda" : "partidos quedan"}
            <br />
            para terminar
          </div>
        </div>
      </div>

      <div
        className="mt-3 h-1.5 overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-valuenow={finished}
        aria-valuemin={0}
        aria-valuemax={totalMatches}
        aria-label={`${finished} de ${totalMatches} partidos jugados`}
      >
        <div className="h-full rounded-full bg-gold" style={{ width: `${percent}%` }} />
      </div>
      <div className="mt-1.5 text-[11px] text-ink-dim">
        {finished} de {totalMatches} jugados{details.length > 0 ? ` · ${details.join(" · ")}` : ""}
      </div>

      <p className="mt-2.5 text-[13px] leading-snug text-ink-dim">
        La polla va solo hasta que se acabe el todos contra todos (las {totalFechas} fechas). Los
        partidos de los 8 clasificados, la fase de grupos y la final no cuentan.
      </p>
    </div>
  );
}
