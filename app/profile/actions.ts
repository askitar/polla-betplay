"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type ProfileActionState = { error: string | null; success?: boolean };

// A resized ~256px JPEG avatar comfortably fits well under this as a data
// URL; this just guards against someone bypassing the client-side resize.
const MAX_IMAGE_DATA_URL_LENGTH = 600_000;

export async function updateProfileAction(
  _prev: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const session = await auth();
  if (!session?.user) return { error: "No autenticado." };

  const name = String(formData.get("name") || "").trim().slice(0, 30);
  if (!name) return { error: "El nombre no puede estar vacío." };

  const image = formData.get("image");
  let imageDataUrl: string | undefined;
  if (typeof image === "string" && image.length > 0) {
    if (!image.startsWith("data:image/")) {
      return { error: "Formato de imagen inválido." };
    }
    if (image.length > MAX_IMAGE_DATA_URL_LENGTH) {
      return { error: "La foto es muy pesada, intenta con otra." };
    }
    imageDataUrl = image;
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name,
      ...(imageDataUrl ? { image: imageDataUrl } : {}),
    },
  });

  revalidatePath("/profile");
  return { error: null, success: true };
}
