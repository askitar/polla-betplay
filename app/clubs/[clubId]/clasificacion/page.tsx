import { Star } from "lucide-react";
import { getClubLeaderboard } from "@/lib/leaderboard-service";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { EmptyNote } from "@/components/ui/EmptyNote";

export default async function ClasificacionPage({
  params,
}: {
  params: Promise<{ clubId: string }>;
}) {
  const { clubId } = await params;
  const leaderboard = await getClubLeaderboard(clubId);

  return (
    <div>
      <SectionLabel>Tabla de posiciones</SectionLabel>
      <div className="card">
        {leaderboard.map((entry, i) => (
          <div
            key={entry.userId}
            className={`flex items-center gap-3 px-1 py-3 ${
              i < leaderboard.length - 1 ? "border-b border-line" : ""
            }`}
          >
            <div
              className={`w-7 text-center font-display text-lg ${
                i === 0 ? "text-gold" : "text-ink-faint"
              }`}
            >
              {i + 1}
            </div>
            <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-line-strong bg-card-hover">
              {entry.userImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={entry.userImage} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center font-condensed text-xs text-ink-dim">
                  {entry.userName.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5 text-[15px] font-semibold">
                {entry.userName}
                {i === 0 && entry.points > 0 && <Star size={13} className="fill-gold text-gold" />}
              </div>
              <div className="text-xs text-ink-dim">
                {entry.played} predicciones · {entry.exact} exactas
              </div>
            </div>
            <div className="font-display text-2xl text-gold">{entry.points}</div>
          </div>
        ))}
        {leaderboard.length === 0 && (
          <EmptyNote>
            Todavía nadie tiene puntos. Se suman cuando se cargan resultados finales.
          </EmptyNote>
        )}
      </div>
      <p className="mt-3.5 text-xs leading-relaxed text-ink-faint">
        Puntaje: 5 pts por marcador exacto · 2 pts por acertar el ganador o el empate · 1 pt por
        acertar el marcador de un solo equipo · 0 pts si fallas del todo (solo cuenta la categoría
        más alta que apliques, no se suman). Las predicciones se cierran 10 minutos antes del
        pitazo inicial y las del resto del club solo se revelan cuando el partido ya arrancó, para
        que nadie se copie.
      </p>
    </div>
  );
}
