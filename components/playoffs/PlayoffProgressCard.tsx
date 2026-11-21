import Link from "next/link";
import { Trophy, Swords } from "lucide-react";
import type { CSSProperties } from "react";
import { GlassIcon } from "@/components/ui/GlassIcon";
import type { PlayoffProgress } from "@/lib/playoffs";

export function PlayoffProgressCard({
  clubId,
  progress,
  participants,
  joined,
}: {
  clubId: string;
  progress: PlayoffProgress;
  participants: number;
  joined: boolean;
}) {
  const { label, finished, remaining, total, live } = progress;
  const percent = total > 0 ? Math.round((finished / total) * 100) : 0;

  if (progress.isOver) {
    return (
      <div className="card rise mb-5 flex items-center gap-4">
        <GlassIcon icon={Trophy} tint="medal" size="lg" />
        <div className="min-w-0">
          <div className="eyebrow">CUADRANGULARES</div>
          <div className="mt-0.5 font-display text-2xl leading-tight">¡Terminaron los cuadrangulares!</div>
          <Link href={`/clubs/${clubId}/clasificacion`} className="mt-2 inline-block text-[13px] font-semibold text-gold">
            Ver la tabla final
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="card rise mb-5">
     <div className="flex items-center gap-4 sm:gap-6">
      <div className="ring ring-sm" style={{ "--p": percent } as CSSProperties} aria-hidden>
        <div className="flex h-full w-full flex-col items-center justify-center">
          <span className="num-gold font-display text-[26px] leading-none">{remaining}</span>
          <span className="font-condensed text-[9px] tracking-[0.14em] text-ink-dim">QUEDAN</span>
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="eyebrow flex items-center gap-1.5 whitespace-nowrap">
            <Swords size={12} /> CUADRANGULARES
          </span>
          {live > 0 && (
            <span className="chip chip-red">
              <span className="live-dot" /> {live} en vivo
            </span>
          )}
          {joined && <span className="chip chip-gold">Jugando</span>}
        </div>
        <div className="mt-0.5 font-display text-[26px] leading-tight sm:text-3xl">{label}</div>
        <div className="mt-1 text-[11.5px] leading-snug text-ink-faint">
          {finished} de {total} jugados · quedan {remaining} · {participants}{" "}
          {participants === 1 ? "participante" : "participantes"}
        </div>
      </div>
     </div>
      <p className="mt-3 border-t border-white/[0.06] pt-2.5 text-[12px] leading-snug text-ink-dim">
        Tabla nueva desde cero, mismas reglas. Cuentan los 24 partidos de grupos (ida y vuelta) y los 2 de la
        final.
      </p>
    </div>
  );
}
