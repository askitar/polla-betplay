import { redirect } from "next/navigation";
import { Users, Crown } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBaseUrl } from "@/lib/base-url";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { GlassIcon } from "@/components/ui/GlassIcon";
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
      include: { user: { select: { id: true, name: true, image: true } } },
      orderBy: { joinedAt: "asc" },
    }),
    getBaseUrl(),
  ]);

  const isAdmin = memberships.some((m) => m.userId === session.user.id && m.role === "ADMIN");

  return (
    <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-8">
      <div>
        <SectionLabel>Invitar gente</SectionLabel>
        <InviteCodeCard code={club.code} inviteUrl={`${baseUrl}/join/${club.code}`} />
      </div>

      <div className="mt-7 lg:mt-0">
        <SectionLabel count={memberships.length}>Miembros</SectionLabel>
        <div className="card flex flex-col gap-1 p-2">
          {memberships.map((m, i) => (
            <div
              key={m.userId}
              className="rise flex items-center gap-3 rounded-xl px-2 py-2"
              style={{ "--i": i } as React.CSSProperties}
            >
              <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-white/15 bg-card-hover">
                {m.user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.user.image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center font-condensed text-xs font-semibold text-ink-dim">
                    {(m.user.name ?? "?").slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1 truncate text-sm font-medium">
                {m.user.name ?? "Sin nombre"}
                {m.userId === session.user.id && <span className="text-ink-faint"> (tú)</span>}
              </div>
              {m.role === "ADMIN" && (
                <span className="chip chip-gold">
                  <Crown size={11} /> Admin
                </span>
              )}
            </div>
          ))}
        </div>

        {isAdmin && (
          <>
            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-3.5">
              <GlassIcon icon={Users} tint="ink" size="sm" />
              <p className="text-xs leading-relaxed text-ink-dim">
                Como admin puedes corregir el marcador final de un partido desde su tarjeta, una vez
                haya terminado. El resultado oficial de la liga igual se impone cuando llega.
              </p>
            </div>

            <SectionLabel className="mt-7">Zona de riesgo</SectionLabel>
            <DeleteClubButton clubId={club.id} clubName={club.name} />
          </>
        )}
      </div>
    </div>
  );
}
