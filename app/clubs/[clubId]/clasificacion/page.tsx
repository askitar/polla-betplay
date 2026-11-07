import { Star, Target, CircleCheck, Circle, Scale } from "lucide-react";
import { getClubLeaderboard } from "@/lib/leaderboard-service";
import { getClubMemberStatsMap } from "@/lib/player-stats-service";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { EmptyNote } from "@/components/ui/EmptyNote";
import { GlassIcon, type GlassTint } from "@/components/ui/GlassIcon";
import { Podium } from "@/components/leaderboard/Podium";
import { LeaderboardList } from "@/components/leaderboard/LeaderboardList";
import { LiveRefresher } from "@/components/live/LiveRefresher";

const RULES: Array<{ icon: typeof Star; tint: GlassTint; title: string; desc: string; pts: string }> = [
  { icon: Target, tint: "red", title: "Marcador exacto", desc: "Aciertas el marcador tal cual.", pts: "5" },
  {
    icon: CircleCheck,
    tint: "blue",
    title: "Ganador o empate",
    desc: "Aciertas quién gana o que empatan. Se suma con gol acertado.",
    pts: "2",
  },
  {
    icon: Circle,
    tint: "green",
    title: "Gol acertado",
    desc: "Aciertas los goles de uno de los dos equipos. Se suma con ganador.",
    pts: "1",
  },
  {
    icon: Star,
    tint: "gold",
    title: "Predicción única",
    desc: "Nadie más del club acertó el exacto. Se suma a los 5.",
    pts: "+2",
  },
];

export default async function ClasificacionPage({
  params,
}: {
  params: Promise<{ clubId: string }>;
}) {
  const { clubId } = await params;
  const [{ entries: leaderboard, hasLiveMatch, lastMatch }, statsByUserMap] = await Promise.all([
    getClubLeaderboard(clubId),
    getClubMemberStatsMap(clubId),
  ]);
  const statsByUser = Object.fromEntries(statsByUserMap);

  return (
    <div className="lg:grid lg:grid-cols-[1fr_340px] lg:items-start lg:gap-8">
      <LiveRefresher active={hasLiveMatch} />

      <div>
        <SectionLabel
          hint={
            lastMatch
              ? `últ.: ${lastMatch.homeTeam} ${lastMatch.homeScore}-${lastMatch.awayScore} ${lastMatch.awayTeam}`
              : undefined
          }
        >
          Tabla de posiciones
        </SectionLabel>

        {hasLiveMatch && (
          <div className="mb-3 flex items-center gap-2 text-[12px] font-semibold text-flag-red">
            <span className="live-dot" />
            Puntaje en vivo, puede cambiar mientras el partido continúa
          </div>
        )}

        {leaderboard.length > 0 ? (
          <>
            <Podium entries={leaderboard} />
            <p className="mb-2.5 text-xs text-ink-faint">
              Toca un jugador para ver de dónde salen sus puntos. &quot;Últ.&quot; es lo que sumó en el
              último partido jugado.
            </p>
            <LeaderboardList leaderboard={leaderboard} statsByUser={statsByUser} />
          </>
        ) : (
          <EmptyNote icon={Star}>
            Todavía nadie tiene puntos. Se suman cuando se cargan resultados finales.
          </EmptyNote>
        )}
      </div>

      <aside className="mt-8 lg:sticky lg:top-24 lg:mt-0">
        <SectionLabel>Cómo se puntúa</SectionLabel>
        <div className="card flex flex-col gap-1 p-2">
          {RULES.map((r, i) => (
            <div
              key={r.title}
              className="rise flex items-center gap-3 rounded-xl px-2 py-2.5 transition hover:bg-white/[0.04]"
              style={{ "--i": i } as React.CSSProperties}
            >
              <GlassIcon icon={r.icon} tint={r.tint} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold">{r.title}</div>
                <div className="text-[11.5px] leading-snug text-ink-dim">{r.desc}</div>
              </div>
              <div className="num-gold font-display text-2xl">{r.pts}</div>
            </div>
          ))}
        </div>
        <p className="mt-2.5 px-1 text-[11.5px] leading-relaxed text-ink-faint">
          Ejemplo: el partido queda 2-1 y predices 2-0. Ganas 2 por el ganador y 1 por el gol del
          local: 3 en total. El exacto no se suma con los otros, son 5 (más 2 si fuiste el único).
          Las predicciones cierran 10 minutos antes del pitazo; desde ahí puedes ver las de los
          demás en cada partido.
        </p>

        <SectionLabel className="mt-6">Empates</SectionLabel>
        <div className="card flex items-start gap-3">
          <GlassIcon icon={Scale} tint="ink" size="sm" />
          <p className="text-[12.5px] leading-relaxed text-ink-dim">
            Con los mismos puntos se comparte el puesto: dos en primer lugar y el siguiente en
            tercero, o uno en primer lugar y dos en segundo.
          </p>
        </div>
      </aside>
    </div>
  );
}
