import type { LucideIcon } from "lucide-react";

export type GlassTint = "gold" | "medal" | "cyan" | "red" | "blue" | "green" | "silver" | "bronze" | "ink";
type GlassSize = "sm" | "md" | "lg" | "xl";

const ICON_PX: Record<GlassSize, number> = { sm: 15, md: 20, lg: 27, xl: 36 };
const SIZE_CLASS: Record<GlassSize, string> = { sm: "gi-sm", md: "", lg: "gi-lg", xl: "gi-xl" };

/**
 * Apple-style frosted squircle around a line icon: gradient rim, top gloss,
 * soft tinted glow. Server-safe (no hooks), so pages can use it directly.
 */
export function GlassIcon({
  icon: Icon,
  tint = "gold",
  size = "md",
  className = "",
  label,
}: {
  icon: LucideIcon;
  tint?: GlassTint;
  size?: GlassSize;
  className?: string;
  label?: string;
}) {
  return (
    <span
      className={`glass-icon gi-${tint} ${SIZE_CLASS[size]} ${className}`}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <Icon size={ICON_PX[size]} strokeWidth={2.1} />
    </span>
  );
}
