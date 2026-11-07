import type { CSSProperties } from "react";

const BALLS = [
  { left: "6%", delay: "0ms", duration: "1100ms", size: 16 },
  { left: "20%", delay: "90ms", duration: "1250ms", size: 12 },
  { left: "36%", delay: "30ms", duration: "1050ms", size: 18 },
  { left: "52%", delay: "150ms", duration: "1300ms", size: 13 },
  { left: "68%", delay: "60ms", duration: "1150ms", size: 17 },
  { left: "84%", delay: "120ms", duration: "1200ms", size: 12 },
];

export function GoalCelebration() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
      {BALLS.map((ball, i) => (
        <span
          key={i}
          className="ball-pop absolute bottom-0"
          style={{ left: ball.left, animationDelay: ball.delay, animationDuration: ball.duration }}
        >
          <span className="ball3d block" style={{ "--s": `${ball.size}px` } as CSSProperties} />
        </span>
      ))}
    </div>
  );
}
