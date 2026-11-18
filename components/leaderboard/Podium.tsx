import { Crown, Medal, Award } from "lucide-react";
import { GlassIcon } from "@/components/ui/GlassIcon";
import type { LeaderboardEntry } from "@/lib/leaderboard-service";

const SLOT = {
  1: { tint: "medal", icon: Crown, height: "min-h-[132px] sm:min-h-[150px]", glow: "from-gold/35" },
  2: { tint: "silver", icon: Medal, height: "min-h-[104px] sm:min-h-[118px]", glow: "from-silver/25" },
  3: { tint: "bronze", icon: Award, height: "min-h-[88px] sm:min-h-[100px]", glow: "from-bronze/25" },
} as const;

function Avatar({ entry, size }: { entry: LeaderboardEntry; size: string }) {
  return (
    <div
      className={`${size} overflow-hidden rounded-full border border-white/20 bg-card-hover shadow-[inset_0_2px_0_rgba(255,255,255,0.25),0_14px_30px_-10px_rgba(0,0,0,0.9)]`}
    >
      {entry.userImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={entry.userImage} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center font-display text-xl text-ink-dim">
          {entry.userName.slice(0, 2).toUpperCase()}
        </span>
      )}
    </div>
  );
}

function lastLabel(p: LeaderboardEntry) {
  return p.lastPoints == null ? "sin pred." : `+${p.lastPoints}`;
}

/**
 * Top 3 as a podium on glass steps with a little perspective: 2nd, 1st, 3rd.
 * Ties on points share a position, so a step can hold several people and a
 * lower step can legitimately not exist (two seconds means no third); empty
 * steps are simply not drawn rather than shown as a hollow box.
 */
export function Podium({ entries }: { entries: LeaderboardEntry[] }) {
  const steps = ([2, 1, 3] as const)
    .map((rank) => ({ rank, people: entries.filter((e) => e.rank === rank) }))
    .filter((s) => s.people.length > 0);
  if (steps.length === 0) return null;

  const cols = steps.length === 3 ? "grid-cols-3" : steps.length === 2 ? "mx-auto max-w-[70%] grid-cols-2" : "mx-auto max-w-[46%] grid-cols-1";

  return (
    <div className="mb-6 [perspective:1200px]">
      <div className={`grid items-end gap-2 sm:gap-3 ${cols}`}>
        {steps.map(({ rank, people }, i) => {
          const s = SLOT[rank];
          const rotate =
            steps.length === 3 && i === 0
              ? "[transform:rotateY(10deg)]"
              : steps.length === 3 && i === 2
                ? "[transform:rotateY(-10deg)]"
                : "";
          const lead = people[0];
          const shared = people.length > 1;
          return (
            <div
              key={rank}
              className="rise flex flex-col items-center"
              style={{ "--i": i + 1 } as React.CSSProperties}
            >
              <div className="relative mb-2 flex flex-col items-center">
                <GlassIcon icon={s.icon} tint={s.tint} size="sm" className="absolute -top-3 z-10 -translate-y-1/2" />
                <div className="mt-3 flex -space-x-3">
                  {people.slice(0, 3).map((p) => (
                    <Avatar
                      key={p.userId}
                      entry={p}
                      size={rank === 1 ? "h-16 w-16 sm:h-20 sm:w-20" : "h-[52px] w-[52px] sm:h-16 sm:w-16"}
                    />
                  ))}
                </div>
              </div>
              <div className="max-w-full truncate px-1 text-center text-[12px] font-semibold sm:text-sm">
                {shared ? people.map((p) => p.userName.split(" ")[0]).join(" · ") : lead.userName}
              </div>
              <div
                className={`${s.height} ${rotate} glass relative mt-2 flex w-full flex-col items-center justify-start overflow-hidden rounded-t-2xl border-b-0 px-1 pb-3 pt-3 shadow-[0_-10px_40px_-20px_rgba(0,0,0,0.8)]`}
              >
                <div className={`pointer-events-none absolute inset-0 bg-gradient-to-b ${s.glow} to-transparent`} />
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/30" />
                <span className="relative font-display text-[13px] text-ink-faint">
                  {rank}°{shared ? " compartido" : ""}
                </span>
                <span className="num-gold relative font-display text-[34px] leading-none sm:text-[42px]">
                  {lead.points}
                </span>
                <span className="relative font-condensed text-[9.5px] tracking-[0.14em] text-ink-dim">PUNTOS</span>
                <div className="relative mt-2 flex justify-center" title="Puntos en el último partido">
                  {shared ? (
                    <span className="px-1 text-center font-condensed text-[10px] leading-tight tracking-wide text-ink-dim">
                      últ.:{" "}
                      {people
                        .slice(0, 3)
                        .map((p) => `${p.userName.split(" ")[0]} ${lastLabel(p)}`)
                        .join(" · ")}
                    </span>
                  ) : (
                    <span className={`chip ${lead.lastPoints ? "chip-green" : ""}`}>{lastLabel(lead)} últ.</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
