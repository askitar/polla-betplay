import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { InviteCodeCard } from "@/components/club/InviteCodeCard";

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

  const memberships = await prisma.membership.findMany({
    where: { clubId },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { joinedAt: "asc" },
  });

  const isAdmin = memberships.some((m) => m.userId === session.user.id && m.role === "ADMIN");

  return (
    <div>
      <SectionLabel>Código de invitación</SectionLabel>
      <InviteCodeCard code={club.code} />
      <p className="mt-2 text-xs text-ink-faint">
        Comparte este código para que tu combo se una al club.
      </p>

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
        <p className="mt-3.5 text-xs leading-relaxed text-ink-faint">
          Como admin, en la pestaña &quot;Partidos&quot; puedes cargar el marcador final de cada
          partido para que se calculen los puntos.
        </p>
      )}
    </div>
  );
}
