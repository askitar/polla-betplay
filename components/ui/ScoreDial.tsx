"use client";

type ScoreDialProps = {
  value: number | null;
  onChange: (value: number) => void;
  disabled?: boolean;
  teamName: string;
};

export function ScoreDial({ value, onChange, disabled, teamName }: ScoreDialProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(Math.min(15, (value ?? 0) + 1))}
        aria-label={`Sumar gol a ${teamName}`}
        className="flex h-[22px] w-[30px] items-center justify-center rounded border border-line-strong text-[10px] text-ink-dim enabled:bg-card-hover enabled:hover:bg-line-strong disabled:cursor-not-allowed disabled:bg-card disabled:text-ink-faint"
      >
        ▲
      </button>
      <div
        className={`flex h-14 w-[52px] items-center justify-center rounded-md border border-line-strong bg-pitch font-display text-[34px] tracking-wide ${
          value == null ? "text-ink-faint/60" : "text-gold"
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
        className="flex h-[22px] w-[30px] items-center justify-center rounded border border-line-strong text-[10px] text-ink-dim enabled:bg-card-hover enabled:hover:bg-line-strong disabled:cursor-not-allowed disabled:bg-card disabled:text-ink-faint"
      >
        ▼
      </button>
    </div>
  );
}
