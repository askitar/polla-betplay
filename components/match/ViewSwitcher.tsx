import Link from "next/link";

export type CronogramaView = "fecha" | "jugados" | "no-jugados" | "aplazados" | "en-vivo";

export const CRONOGRAMA_VIEWS: { id: CronogramaView; label: string }[] = [
  { id: "fecha", label: "Por fecha" },
  { id: "jugados", label: "Jugados" },
  { id: "no-jugados", label: "Por jugar" },
  { id: "aplazados", label: "Aplazados" },
  { id: "en-vivo", label: "En vivo" },
];

export function ViewSwitcher({ clubId, current }: { clubId: string; current: CronogramaView }) {
  return (
    <div className="mb-5 flex flex-wrap justify-center gap-2">
      {CRONOGRAMA_VIEWS.map((v) => (
        <Link
          key={v.id}
          href={`/clubs/${clubId}/cronograma${v.id === "fecha" ? "" : `?view=${v.id}`}`}
          className={`rounded-full px-3.5 py-1.5 font-condensed text-[13px] font-semibold tracking-wide transition-all ${
            current === v.id
              ? "bg-gold text-pitch shadow-[0_0_18px_rgba(255,199,44,0.35)]"
              : "border border-line-strong text-ink-dim hover:border-gold-dim hover:text-ink"
          }`}
        >
          {v.label}
        </Link>
      ))}
    </div>
  );
}
