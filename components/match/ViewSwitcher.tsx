import Link from "next/link";

export type CronogramaView = "fecha" | "jugados" | "no-jugados" | "aplazados" | "en-vivo";

export const CRONOGRAMA_VIEWS: { id: CronogramaView; label: string }[] = [
  { id: "fecha", label: "Por fecha" },
  { id: "jugados", label: "Jugados" },
  { id: "no-jugados", label: "Por jugar" },
  { id: "aplazados", label: "Aplazados" },
  { id: "en-vivo", label: "En vivo" },
];

export function ViewSwitcher({
  clubId,
  current,
  torneoQuery = "",
}: {
  clubId: string;
  current: CronogramaView;
  /** "torneo=liga" to stay on the league while switching views. */
  torneoQuery?: string;
}) {
  return (
    <div className="mb-5 flex justify-center">
      <div className="seg">
        {CRONOGRAMA_VIEWS.map((v) => (
          <Link
            key={v.id}
            href={`/clubs/${clubId}/cronograma${
              v.id === "fecha"
                ? torneoQuery
                  ? `?${torneoQuery}`
                  : ""
                : `?view=${v.id}${torneoQuery ? `&${torneoQuery}` : ""}`
            }`}
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
