import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBaseUrl } from "@/lib/base-url";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { InviteCodeCard } from "@/components/club/InviteCodeCard";
import { DeleteClubButton } from "@/components/club/DeleteClubButton";

export default async function ClubTabPage({
  params,
}: {
  params: Promise<{ clubId: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  const { clubId } = await params;
  const club = await prisma.club.findUnique({ where: { id: clubId } });
  if (!club) redirect("/clubs");

  const [memberships, baseUrl] = await Promise.all([
    prisma.membership.findMany({
      where: { clubId },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { joinedAt: "asc" },
    }),
    getBaseUrl(),
  ]);

  const isAdmin = memberships.some((m) => m.userId === session.user.id && m.role === "ADMIN");

  return (
    <div>
      <SectionLabel>Invitar gente</SectionLabel>
      <InviteCodeCard code={club.code} inviteUrl={`${baseUrl}/join/${club.code}`} />

      <SectionLabel className="mt-7">Miembros ({memberships.length})</SectionLabel>
      <div className="card">
        {memberships.map((m, i) => (
          <div
            key={m.userId}
            className={`flex items-center gap-2.5 py-2.5 ${
              i < memberships.length - 1 ? "border-b border-line" : ""
            }`}
          >
            <Users size={14} className="text-ink-dim" />
            <div className="text-sm">{m.user.name ?? "Sin nombre"}</div>
            {m.role === "ADMIN" && <span className="ml-auto text-[11px] text-gold">ADMIN</span>}
          </div>
        ))}
      </div>

      {isAdmin && (
        <>
          <p className="mt-3.5 text-xs leading-relaxed text-ink-faint">
            Como admin, en la pestaña &quot;Partidos&quot; puedes cargar el marcador final de cada
            partido para que se calculen los puntos.
          </p>

          <SectionLabel className="mt-7">Zona de riesgo</SectionLabel>
          <DeleteClubButton clubId={club.id} clubName={club.name} />
        </>
      )}
    </div>
  );
}
