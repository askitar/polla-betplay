export function SectionLabel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`mb-2.5 font-condensed text-[13px] uppercase tracking-[0.15em] text-ink-dim ${className}`}
    >
      {children}
    </div>
  );
}
