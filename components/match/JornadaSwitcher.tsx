import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function JornadaSwitcher({
  clubId,
  jornadas,
  current,
  extraQuery = "",
  currentLabel = null,
}: {
  clubId: string;
  jornadas: number[];
  current: number;
  /** Appended to every link, e.g. "&torneo=liga". */
  extraQuery?: string;
  /** Replaces "FECHA N de M" for special rounds such as the final. */
  currentLabel?: string | null;
}) {
  const idx = jornadas.indexOf(current);
  const prev = idx > 0 ? jornadas[idx - 1] : null;
  const next = idx >= 0 && idx < jornadas.length - 1 ? jornadas[idx + 1] : null;

  return (
    <div className="mb-5 flex items-center justify-center gap-3">
      <Link
        href={prev ? `/clubs/${clubId}/cronograma?fecha=${prev}${extraQuery}` : "#"}
        className={`icon-btn ${!prev ? "pointer-events-none opacity-30" : ""}`}
        aria-disabled={!prev}
        aria-label="Fecha anterior"
      >
        <ChevronLeft size={16} />
      </Link>
      <div className="glass flex min-w-[150px] items-baseline justify-center gap-2 rounded-full px-5 py-2">
        {currentLabel ? (
          <span className="num-gold font-display text-2xl leading-none">{currentLabel}</span>
        ) : (
          <>
            <span className="font-condensed text-xs tracking-[0.2em] text-ink-dim">FECHA</span>
            <span className="num-gold font-display text-2xl leading-none">{current}</span>
            <span className="font-condensed text-xs text-ink-faint">de {jornadas[jornadas.length - 1]}</span>
          </>
        )}
      </div>
      <Link
        href={next ? `/clubs/${clubId}/cronograma?fecha=${next}${extraQuery}` : "#"}
        className={`icon-btn ${!next ? "pointer-events-none opacity-30" : ""}`}
        aria-disabled={!next}
        aria-label="Fecha siguiente"
      >
        <ChevronRight size={16} />
      </Link>
    </div>
  );
}
