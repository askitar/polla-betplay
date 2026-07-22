// Procedural team badges: no real club crests are used (trademark reasons),
// each team gets a deterministic 2-color gradient + initials derived from
// its name. Ported from the prototype (polla-betplay.jsx lines 32-49).

export const BADGE_PALETTE = [
  "#CE1126",
  "#0B3D91",
  "#FFC72C",
  "#1F7A3D",
  "#8B2FC9",
  "#D9761E",
  "#2C8C8C",
  "#B03A5B",
];

export function hashStr(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function teamColors(seed: string): [string, string] {
  const h = hashStr(seed);
  const i1 = h % BADGE_PALETTE.length;
  let i2 = Math.floor(h / BADGE_PALETTE.length) % BADGE_PALETTE.length;
  if (i2 === i1) i2 = (i1 + 3) % BADGE_PALETTE.length;
  return [BADGE_PALETTE[i1], BADGE_PALETTE[i2]];
}

const NAME_PREFIX_RE = /^(Deportivo|Deportes|Atlético|Atletico|Independiente)\s+/i;

export function teamInitials(name: string): string {
  const words = name.replace(NAME_PREFIX_RE, "").split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}
