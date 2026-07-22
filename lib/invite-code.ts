import { prisma } from "@/lib/prisma";

// Excludes visually ambiguous characters (0/O, 1/I/L). Ported from the
// prototype's makeCode() (polla-betplay.jsx lines 76-81).
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;

export function makeCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return code;
}

export async function generateUniqueClubCode(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = makeCode();
    const existing = await prisma.club.findUnique({ where: { code } });
    if (!existing) return code;
  }
  throw new Error("No se pudo generar un código de club único, intenta de nuevo.");
}
