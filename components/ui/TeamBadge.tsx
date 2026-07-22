import { teamColors, teamInitials } from "@/lib/design/team-badge";

type TeamBadgeProps = {
  name: string;
  /** Unique per render site (e.g. `${matchId}-home`) so gradient ids never collide when the same team appears in multiple cards on one page. */
  uid: string;
  size?: number;
};

export function TeamBadge({ name, uid, size = 34 }: TeamBadgeProps) {
  const [c1, c2] = teamColors(name);
  const gid = `grad-${uid}`;
  return (
    <svg
      width={size}
      height={size * 1.12}
      viewBox="0 0 40 45"
      className="shrink-0 drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]"
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
      </defs>
      <path
        d="M20 1.5 L37 7.5 V21 C37 32.5 29.5 40.5 20 43.5 C10.5 40.5 3 32.5 3 21 V7.5 Z"
        fill={`url(#${gid})`}
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="1.2"
      />
      <text
        x="20"
        y="25.5"
        textAnchor="middle"
        fontFamily="var(--font-condensed)"
        fontWeight={700}
        fontSize="13.5"
        fill="#F3EFDD"
        letterSpacing="0.5"
      >
        {teamInitials(name)}
      </text>
    </svg>
  );
}
