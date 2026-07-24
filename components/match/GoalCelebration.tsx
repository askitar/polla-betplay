const BALLS = [
  { left: "6%", delay: "0ms", duration: "1100ms" },
  { left: "20%", delay: "90ms", duration: "1250ms" },
  { left: "36%", delay: "30ms", duration: "1050ms" },
  { left: "52%", delay: "150ms", duration: "1300ms" },
  { left: "68%", delay: "60ms", duration: "1150ms" },
  { left: "84%", delay: "120ms", duration: "1200ms" },
];

export function GoalCelebration() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
      {BALLS.map((ball, i) => (
        <span
          key={i}
          className="ball-pop absolute bottom-0 text-xl"
          style={{ left: ball.left, animationDelay: ball.delay, animationDuration: ball.duration }}
        >
          ⚽
        </span>
      ))}
    </div>
  );
}
