import { NextResponse } from "next/server";
import { seedRemainingFechas } from "@/lib/seed-remaining-fechas";

// One-time-safe production seeding for Fechas 2-19 (upsert-only, never
// deletes/overwrites an existing match). Protected by the same shared
// secret as the other admin/cron routes.
export async function POST(request: Request) {
  if (request.headers.get("x-cron-secret") !== process.env.CRON_SHARED_SECRET) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const result = await seedRemainingFechas();
  return NextResponse.json(result);
}
