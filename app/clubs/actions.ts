"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { createClubForUser, joinClubByCode } from "@/lib/club-service";

export type ActionState = { error: string | null };

export async function createClubAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  const name = String(formData.get("name") || "").trim().slice(0, 40);
  if (!name) return { error: "Ponle un nombre a tu club." };

  const club = await createClubForUser(session.user.id, name);
  redirect(`/clubs/${club.id}`);
}

export async function joinClubAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  const code = String(formData.get("code") || "").trim();
  if (!code) return { error: "Escribe un código de invitación." };

  const result = await joinClubByCode(session.user.id, code);
  if ("error" in result) return { error: result.error };

  redirect(`/clubs/${result.club.id}`);
}
