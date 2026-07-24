"use client";

import { useEffect, useState } from "react";

function formatRemaining(ms: number): string {
  if (ms <= 0) return "¡Arrancó!";
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export function CountdownTimer({ kickoff }: { kickoff: string }) {
  const target = new Date(kickoff).getTime();
  const [label, setLabel] = useState(() => formatRemaining(target - Date.now()));

  useEffect(() => {
    const id = setInterval(() => {
      setLabel(formatRemaining(target - Date.now()));
    }, 1000);
    return () => clearInterval(id);
  }, [target]);

  return (
    <div className="absolute -top-3 right-4 flex items-center gap-1.5 whitespace-nowrap rounded bg-pitch px-2.5 py-1 ring-1 ring-gold/50">
      <span className="font-condensed text-[10px] tracking-wide text-gold-dim">COMIENZA EN</span>
      <span className="font-condensed text-sm font-bold tracking-wide text-gold">{label}</span>
    </div>
  );
}
