"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Re-fetches the current route's server data on an interval while a match
 * is live, so the score/clock/points update on their own instead of needing
 * a manual reload. Renders nothing; no-ops entirely when `active` is false.
 */
export function LiveRefresher({
  active,
  intervalMs = 20_000,
}: {
  active: boolean;
  intervalMs?: number;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [active, intervalMs, router]);

  return null;
}
