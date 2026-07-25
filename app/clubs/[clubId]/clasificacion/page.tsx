import { Star, Target, CircleCheck, Circle } from "lucide-react";
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
      <SectionLabel className="mt-7">Reglas de puntaje</SectionLabel>
      <div className="card">
        <div className="flex items-center justify-between gap-3 border-b border-line py-2.5">
          <div className="flex items-center gap-2.5">
            <Target size={16} className="shrink-0 text-flag-red" />
            <div>
              <div className="text-[13px] font-semibold">Marcador exacto</div>
              <div className="text-xs text-ink-dim">Aciertas el marcador exacto del partido.</div>
            </div>
          </div>
          <div className="font-display text-xl text-gold">5</div>
        </div>
        <div className="flex items-center justify-between gap-3 border-b border-line py-2.5">
          <div className="flex items-center gap-2.5">
            <CircleCheck size={16} className="shrink-0 text-flag-blue" />
            <div>
              <div className="text-[13px] font-semibold">Ganador o empate acertado</div>
              <div className="text-xs text-ink-dim">
                No aciertas el marcador exacto, pero sí quién gana o si es empate.
              </div>
            </div>
          </div>
          <div className="font-display text-xl text-gold">2</div>
        </div>
        <div className="flex items-center justify-between gap-3 border-b border-line py-2.5">
          <div className="flex items-center gap-2.5">
            <Circle size={16} className="shrink-0 text-acierto" />
            <div>
              <div className="text-[13px] font-semibold">Gol acertado</div>
              <div className="text-xs text-ink-dim">
                No aciertas el marcador exacto, pero sí el número de goles de uno de los dos
                equipos.
              </div>
            </div>
          </div>
          <div className="font-display text-xl text-gold">1</div>
        </div>
        <div className="flex items-center justify-between gap-3 py-2.5">
          <div className="flex items-center gap-2.5">
            <Star size={16} className="shrink-0 fill-gold text-gold" />
            <div>
              <div className="text-[13px] font-semibold">Predicción única</div>
              <div className="text-xs text-ink-dim">
                Fuiste el único del club en acertar el marcador exacto de ese partido. Es el único
                caso donde los puntos se acumulan: se suman a los 5 de marcador exacto.
              </div>
            </div>
          </div>
          <div className="font-display text-xl text-gold">+2</div>
        </div>
      </div>
      <p className="mt-2.5 text-xs leading-relaxed text-ink-faint">
        Solo cuenta la categoría más alta que apliques entre marcador exacto, ganador/empate y
        gol (no se suman entre sí). Las predicciones se cierran 10 minutos antes del pitazo
        inicial; desde ese momento puedes ver las del resto del club tocando &quot;Predicciones
        jugadores&quot; en cada partido, para que nadie se copie antes.
      </p>

      <SectionLabel className="mt-7">Criterios de desempate</SectionLabel>
      <div className="card">
        <p className="text-xs leading-relaxed text-ink-dim">
          Si dos o más jugadores quedan empatados en puntos, la posición se define con estos
          criterios, en este orden, hasta romper el empate:
        </p>
        <ol className="mt-2.5 flex flex-col gap-1.5 pl-4 text-xs leading-relaxed text-ink-dim">
          <li className="list-decimal">Mayor número de marcadores exactos acertados.</li>
          <li className="list-decimal">Mayor número de ganadores o empates acertados.</li>
          <li className="list-decimal">Mayor número de goles acertados.</li>
          <li className="list-decimal">Mayor número de predicciones únicas.</li>
        </ol>
        <p className="mt-2.5 text-xs leading-relaxed text-ink-faint">
          Si el empate persiste después de todos los criterios, los jugadores comparten la misma
          posición.
        </p>
      </div>
    </div>
  );
}
