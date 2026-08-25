import { NextResponse } from "next/server";
import { Receiver } from "@upstash/qstash";
import { sendDailyDigests, sendDailyDigestToEmail } from "@/lib/daily-digest";

const receiver =
  process.env.QSTASH_CURRENT_SIGNING_KEY && process.env.QSTASH_NEXT_SIGNING_KEY
    ? new Receiver({
        currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY,
        nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY,
      })
    : null;

async function isAuthorized(request: Request, body: string) {
  // Shared secret first: lets an admin trigger a one-off send (e.g. a test
  // digest) without a real QStash signature, same as the other admin routes.
  if (request.headers.get("x-cron-secret") === process.env.CRON_SHARED_SECRET) return true;
  if (receiver) {
    const signature = request.headers.get("upstash-signature");
    if (!signature) return false;
    return receiver.verify({ signature, body, url: request.url }).catch(() => false);
  }
  return false;
}

export async function POST(request: Request) {
  const body = await request.text();

  if (!(await isAuthorized(request, body))) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  let test: string | undefined;
  if (body) {
    try {
      test = (JSON.parse(body) as { test?: string }).test;
    } catch {
      // No body / not JSON: proceed as a normal full send.
    }
  }

  try {
    const result = test ? await sendDailyDigestToEmail(test) : await sendDailyDigests();
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error desconocido." },
      { status: 500 },
    );
  }
}
