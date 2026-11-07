"use client";

import { ChevronDown, ChevronUp } from "lucide-react";

type ScoreDialProps = {
  value: number | null;
  onChange: (value: number) => void;
  disabled?: boolean;
  teamName: string;
};

const STEP_BTN =
  "flex h-7 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] text-ink-dim " +
  "shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-all duration-150 " +
  "enabled:hover:bg-white/[0.12] enabled:hover:text-ink enabled:active:scale-90 " +
  "disabled:cursor-not-allowed disabled:opacity-40";

export function ScoreDial({ value, onChange, disabled, teamName }: ScoreDialProps) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(Math.min(15, (value ?? 0) + 1))}
        aria-label={`Sumar gol a ${teamName}`}
        className={STEP_BTN}
      >
        <ChevronUp size={15} strokeWidth={2.5} />
      </button>
      <div
        className={`flex h-[58px] w-[56px] items-center justify-center rounded-xl border border-white/10 bg-black/40 font-display text-[36px] tracking-wide shadow-[inset_0_3px_10px_rgba(0,0,0,0.7),0_1px_0_rgba(255,255,255,0.06)] ${
          value == null ? "text-ink-faint/50" : "num-gold"
        }`}
        aria-live="polite"
      >
        {value ?? "–"}
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(Math.max(0, (value ?? 1) - 1))}
        aria-label={`Restar gol a ${teamName}`}
        className={STEP_BTN}
      >
        <ChevronDown size={15} strokeWidth={2.5} />
      </button>
    </div>
  );
}
