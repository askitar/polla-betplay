export function SectionLabel({
  children,
  className = "",
  count,
  hint,
}: {
  children: React.ReactNode;
  className?: string;
  /** Optional item count shown as a small pill. */
  count?: number;
  /** Optional muted note on the right. */
  hint?: React.ReactNode;
}) {
  return (
    <div className={`mb-3 flex items-center gap-2.5 ${className}`}>
      <span className="font-condensed text-[13px] font-semibold uppercase tracking-[0.18em] text-ink-dim">
        {children}
      </span>
      {typeof count === "number" && <span className="chip">{count}</span>}
      <span className="h-px flex-1 bg-gradient-to-r from-line-strong to-transparent" />
      {hint && <span className="text-[11px] text-ink-faint">{hint}</span>}
    </div>
  );
}
