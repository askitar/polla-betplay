import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function JornadaSwitcher({
  clubId,
  jornadas,
  current,
}: {
  clubId: string;
  jornadas: number[];
  current: number;
}) {
  const idx = jornadas.indexOf(current);
  const prev = idx > 0 ? jornadas[idx - 1] : null;
  const next = idx >= 0 && idx < jornadas.length - 1 ? jornadas[idx + 1] : null;

  return (
    <div className="mb-5 flex items-center justify-center gap-4">
      <Link
        href={prev ? `/clubs/${clubId}/cronograma?fecha=${prev}` : "#"}
        className={`icon-btn ${!prev ? "pointer-events-none opacity-30" : ""}`}
        aria-disabled={!prev}
      >
        <ChevronLeft size={16} />
      </Link>
      <div className="font-condensed text-sm tracking-[0.15em] text-ink-dim">
        FECHA <span className="text-gold">{current}</span>
      </div>
      <Link
        href={next ? `/clubs/${clubId}/cronograma?fecha=${next}` : "#"}
        className={`icon-btn ${!next ? "pointer-events-none opacity-30" : ""}`}
        aria-disabled={!next}
      >
        <ChevronRight size={16} />
      </Link>
    </div>
  );
}
