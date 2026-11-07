import type { LucideIcon } from "lucide-react";
import { GlassIcon } from "@/components/ui/GlassIcon";

export function EmptyNote({
  children,
  icon,
}: {
  children: React.ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex items-center gap-3.5 rounded-2xl border border-dashed border-line-strong bg-white/[0.02] px-4 py-4 text-[13px] leading-relaxed text-ink-dim">
      {icon && <GlassIcon icon={icon} tint="ink" size="sm" />}
      <span>{children}</span>
    </div>
  );
}
