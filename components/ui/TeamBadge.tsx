import { teamColors, teamInitials } from "@/lib/design/team-badge";

type TeamBadgeProps = {
  name: string;
  /** Unique per render site (e.g. `${matchId}-home`) so gradient ids never collide when the same team appears in multiple cards on one page. */
  uid: string;
  size?: number;
};

/** Procedural shield with a bevelled rim and a gloss so it reads as a solid object. */
export function TeamBadge({ name, uid, size = 34 }: TeamBadgeProps) {
  const [c1, c2] = teamColors(name);
  const gid = `grad-${uid}`;
  const gloss = `gloss-${uid}`;
  const rim = `rim-${uid}`;
  return (
    <svg
      width={size}
      height={size * 1.12}
      viewBox="0 0 40 45"
      className="shrink-0 drop-shadow-[0_3px_4px_rgba(0,0,0,0.55)]"
      role="img"
      aria-label={`Escudo de ${name}`}
    >
      <defs>
        <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={c1} />
          <stop offset="49%" stopColor={c1} />
          <stop offset="51%" stopColor={c2} />
          <stop offset="100%" stopColor={c2} />
        </linearGradient>
        <linearGradient id={gloss} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.45" />
          <stop offset="45%" stopColor="#fff" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.25" />
        </linearGradient>
        <linearGradient id={rim} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0.15" />
        </linearGradient>
      </defs>
      <path
        d="M20 1.5 L37 7.5 V21 C37 32.5 29.5 40.5 20 43.5 C10.5 40.5 3 32.5 3 21 V7.5 Z"
        fill={`url(#${gid})`}
      />
      <path
        d="M20 1.5 L37 7.5 V21 C37 32.5 29.5 40.5 20 43.5 C10.5 40.5 3 32.5 3 21 V7.5 Z"
        fill={`url(#${gloss})`}
        stroke={`url(#${rim})`}
        strokeWidth="1.3"
      />
      <text
        x="20"
        y="25.5"
        textAnchor="middle"
        fontFamily="var(--font-condensed)"
        fontWeight={700}
        fontSize="13.5"
        fill="#FFFFFF"
        letterSpacing="0.5"
        style={{ paintOrder: "stroke", stroke: "rgba(0,0,0,0.35)", strokeWidth: 1.5 }}
      >
        {teamInitials(name)}
      </text>
    </svg>
  );
}
