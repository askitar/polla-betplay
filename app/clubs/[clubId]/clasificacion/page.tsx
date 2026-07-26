import { Star, Target, CircleCheck, Circle } from "lucide-react";
import { getClubLeaderboard } from "@/lib/leaderboard-service";
import { getClubMemberStatsMap } from "@/lib/player-stats-service";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { EmptyNote } from "@/components/ui/EmptyNote";
import { LeaderboardList } from "@/components/leaderboard/LeaderboardList";
import { LiveRefresher } from "@/components/live/LiveRefresher";

export default async function ClasificacionPage({
  params,
}: {
  params: Promise<{ clubId: string }>;
}) {
  const { clubId } = await params;
  const [{ entries: leaderboard, hasLiveMatch }, statsByUserMap] = await Promise.all([
    getClubLeaderboard(clubId),
    getClubMemberStatsMap(clubId),
  ]);
  const statsByUser = Object.fromEntries(statsByUserMap);

  return (
    <div>
      <LiveRefresher active={hasLiveMatch} />
      <SectionLabel>Tabla de posiciones</SectionLabel>
      <p className="mb-2.5 text-xs text-ink-faint">Toca un jugador para ver el detalle de sus puntos.</p>
      {hasLiveMatch && (
        <div className="mb-2.5 flex items-center gap-1.5 text-[12px] font-semibold text-flag-red">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-flag-red opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-flag-red" />
          </span>
          Puntaje en vivo — puede cambiar mientras el partido continúa
        </div>
      )}
      <div className="card">
        {leaderboard.length > 0 ? (
          <LeaderboardList leaderboard={leaderboard} statsByUser={statsByUser} />
        ) : (
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
                No aciertas el marcador exacto, pero sí quién gana o si es empate. Se puede
                combinar con gol acertado.
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
                equipos. Se puede combinar con ganador o empate acertado.
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
        Ganador/empate y gol acertado se pueden combinar en un mismo partido: por ejemplo, si el
        resultado real es 2-1 y predices 2-0, ganas los 2 puntos por acertar el ganador más 1
        punto por acertar el gol del local, +3 en total. Marcador exacto es aparte: si aciertas el
        marcador exacto no se suman los otros dos, solo los 5 puntos (más los 2 de predicción
        única si aplica). Las predicciones se cierran 10 minutos antes del pitazo inicial; desde
        ese momento puedes ver las del resto del club tocando &quot;Predicciones jugadores&quot;
        en cada partido, para que nadie se copie antes.
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
