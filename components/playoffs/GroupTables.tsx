import { TeamBadge } from "@/components/ui/TeamBadge";
import type { GroupTable } from "@/lib/playoff-service";

/**
 * The two real cuadrangular groups (how the teams themselves are doing, not
 * the pool). The leader of each group goes to the final.
 */
export function GroupTables({ tables, compact = false }: { tables: GroupTable[]; compact?: boolean }) {
  if (tables.length === 0) return null;
  return (
    <div className={`grid gap-3 ${compact ? "" : "sm:grid-cols-2"}`}>
      {tables.map(({ group, rows }) => (
        <div key={group} className="card rise p-3.5 sm:p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-display text-xl">
              Grupo <span className="text-gold">{group}</span>
            </span>
            <span className="text-[10.5px] text-ink-faint">el 1° va a la final</span>
          </div>
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="font-condensed text-[10.5px] tracking-[0.12em] text-ink-faint">
                <th className="w-5 pb-1.5 text-left font-medium">#</th>
                <th className="pb-1.5 text-left font-medium">EQUIPO</th>
                <th className="w-7 pb-1.5 text-center font-medium">PJ</th>
                {!compact && <th className="w-7 pb-1.5 text-center font-medium">G</th>}
                {!compact && <th className="w-7 pb-1.5 text-center font-medium">E</th>}
                {!compact && <th className="w-7 pb-1.5 text-center font-medium">P</th>}
                <th className="w-8 pb-1.5 text-center font-medium">DG</th>
                <th className="w-9 pb-1.5 text-right font-medium">PTS</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.team}
                  className={`border-t border-white/[0.06] ${r.position === 1 && r.played > 0 ? "bg-gold/[0.07]" : ""}`}
                >
                  <td className={`py-2 font-display ${r.position === 1 ? "text-gold" : "text-ink-faint"}`}>
                    {r.position}
                  </td>
                  <td className="py-2">
                    <span className="flex min-w-0 items-center gap-2">
                      <TeamBadge name={r.team} uid={`grp-${group}-${r.team}`} size={22} />
                      <span className="truncate font-semibold">{r.team}</span>
                    </span>
                  </td>
                  <td className="py-2 text-center text-ink-dim">{r.played}</td>
                  {!compact && <td className="py-2 text-center text-ink-dim">{r.won}</td>}
                  {!compact && <td className="py-2 text-center text-ink-dim">{r.drawn}</td>}
                  {!compact && <td className="py-2 text-center text-ink-dim">{r.lost}</td>}
                  <td className="py-2 text-center text-ink-dim">
                    {r.goalDiff > 0 ? `+${r.goalDiff}` : r.goalDiff}
                  </td>
                  <td className="py-2 text-right font-display text-[17px]">{r.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
