"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Re-fetches the current route's server data on an interval while a match
 * is live, so the score/clock/points update on their own instead of needing
 * a manual reload. Renders nothing; no-ops entirely when `active` is false.
 *
 * Every tick is a full server re-render of the page (several database
 * queries), multiplied by every open tab in the club — which is why this
 * deliberately does NOT poll aggressively, and stops completely while the
 * tab is in the background. Left unchecked it was a big share of the
 * database compute that blew through the monthly quota and took the site
 * down. Coming back to the tab refreshes immediately, so what you actually
 * look at is still current.
 */
export function LiveRefresher({
  active,
  intervalMs = 45_000,
}: {
  active: boolean;
  intervalMs?: number;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!active) return;

    let id: ReturnType<typeof setInterval> | null = null;

    const stop = () => {
      if (id !== null) {
        clearInterval(id);
        id = null;
      }
    };
    const start = () => {
      if (id === null) id = setInterval(() => router.refresh(), intervalMs);
    };

    const onVisibility = () => {
      if (document.hidden) {
        stop();
      } else {
        // Catch up on whatever changed while the tab was hidden, then
        // resume the normal cadence.
        router.refresh();
        start();
      }
    };

    if (!document.hidden) start();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [active, intervalMs, router]);

  return null;
}
