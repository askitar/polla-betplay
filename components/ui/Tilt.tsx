"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";

/**
 * Subtle 3D tilt that follows the mouse, with a glare that children can
 * render via <span className="glare" />. Mouse only: on touch there is no
 * hover to follow, so it stays flat and never fights scrolling.
 */
export function Tilt({
  children,
  className = "",
  max = 6,
  style,
}: {
  children: ReactNode;
  className?: string;
  /** Max rotation in degrees on each axis. */
  max?: number;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse") return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--ry", `${(px * max * 2).toFixed(2)}deg`);
    el.style.setProperty("--rx", `${(-py * max * 2).toFixed(2)}deg`);
    el.style.setProperty("--gx", `${((px + 0.5) * 100).toFixed(1)}%`);
    el.style.setProperty("--gy", `${((py + 0.5) * 100).toFixed(1)}%`);
  }

  function reset() {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  }

  return (
    <div
      ref={ref}
      className={`tilt ${className}`}
      style={style}
      onPointerMove={onMove}
      onPointerLeave={reset}
    >
      {children}
    </div>
  );
}
