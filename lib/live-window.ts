import { revalidateTag, unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

export const LIVE_WINDOWS_TAG = "live-windows";

/**
 * Kickoffs of every pending match (SCHEDULED or LIVE) from a few hours ago to
 * a day and a half ahead. Cached across cron ticks (Vercel's data cache), so
 * the every-5-minutes cron does not wake the database just to find out that
 * nothing is playing: the query runs about twice an hour, plus right after a
 * sync or reconciliation changes something (see refreshLiveWindows).
 */
export const getPendingKickoffs = unstable_cache(
  async () => {
    const now = Date.now();
    const rows = await prisma.match.findMany({
      where: {
        status: { in: ["SCHEDULED", "LIVE"] },
        kickoff: { gte: new Date(now - 6 * 60 * 60_000), lte: new Date(now + 36 * 60 * 60_000) },
      },
      select: { kickoff: true },
    });
    return rows.map((r) => r.kickoff.toISOString());
  },
  ["pending-kickoffs-v1"],
  { revalidate: 1800, tags: [LIVE_WINDOWS_TAG] },
);

/** Drop the cached kickoffs now, e.g. once a match finished or moved. */
export function refreshLiveWindows() {
  revalidateTag(LIVE_WINDOWS_TAG, { expire: 0 });
}
