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
    <div className="mb-5 flex justify-center">
      <div className="seg">
        {CRONOGRAMA_VIEWS.map((v) => (
          <Link
            key={v.id}
            href={`/clubs/${clubId}/cronograma${v.id === "fecha" ? "" : `?view=${v.id}`}`}
            className="seg-item"
            data-active={current === v.id}
          >
            {v.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
