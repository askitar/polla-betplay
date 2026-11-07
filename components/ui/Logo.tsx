import { Ball3D } from "@/components/ui/Ball3D";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <Ball3D size={compact ? 26 : 34} float={false} shadow={false} />
      <div className="flex items-baseline gap-2">
        <span className={`num-gold font-display leading-none ${compact ? "text-[26px]" : "text-[36px]"}`}>
          LA POLLA
        </span>
        <span className="font-condensed text-sm tracking-[0.18em] text-ink-dim">LIGA BETPLAY</span>
      </div>
    </div>
  );
}
