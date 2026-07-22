import { NextResponse } from "next/server";
import { seedFecha1 } from "@/lib/seed-fecha1";

// One-time-safe production seeding (upsert-only, never deletes). Protected
// by the same shared secret as the cron route so it isn't publicly callable.
export async function POST(request: Request) {
  if (request.headers.get("x-cron-secret") !== process.env.CRON_SHARED_SECRET) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const result = await seedFecha1();
  return NextResponse.json(result);
}
