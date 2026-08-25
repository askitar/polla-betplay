"use client";

import { useEffect } from "react";

// Site-wide click/tap sound, wired once via event delegation instead of
// touching every button and link individually. A short synthesized tone
// (no audio file to ship) — a plain tick for most taps, a slightly richer
// two-note pop for primary actions (.btn-primary), so confirming something
// feels distinct from just navigating.
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  audioCtx = audioCtx ?? new Ctor();
  return audioCtx;
}

function playClick(kind: "tick" | "confirm") {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (kind === "confirm") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(660, t0);
      osc.frequency.exponentialRampToValueAtTime(880, t0 + 0.09);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.1, t0 + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.16);
      osc.start(t0);
      osc.stop(t0 + 0.17);
    } else {
      osc.type = "sine";
      osc.frequency.setValueAtTime(1200, t0);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.05, t0 + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.045);
      osc.start(t0);
      osc.stop(t0 + 0.05);
    }
  } catch {
    // Autoplay/audio policy quirks shouldn't ever break a click.
  }
}

const INTERACTIVE_SELECTOR = 'button, a[href], [role="button"], input[type="button"], input[type="submit"]';

export function SoundEffects() {
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = e.target as Element | null;
      const el = target?.closest(INTERACTIVE_SELECTOR);
      if (!el || el.hasAttribute("data-no-sound")) return;
      if ("disabled" in el && (el as HTMLButtonElement).disabled) return;
      playClick(el.classList.contains("btn-primary") ? "confirm" : "tick");
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
