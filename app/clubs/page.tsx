import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, Shield, Plus, KeyRound } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Logo } from "@/components/ui/Logo";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { GlassIcon } from "@/components/ui/GlassIcon";
import { CreateClubForm } from "@/components/clubs/CreateClubForm";
import { JoinClubForm } from "@/components/clubs/JoinClubForm";

export default async function ClubsPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  const memberships = await prisma.membership.findMany({
    where: { userId: session.user.id },
    include: { club: { include: { _count: { select: { memberships: true } } } } },
    orderBy: { joinedAt: "desc" },
  });

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-5 py-10 lg:max-w-3xl">
      <Logo />
      <p className="mt-3 mb-8 text-[15px] leading-relaxed text-ink-dim">
        Hola, <span className="font-semibold text-ink">{session.user.name}</span>.
        {memberships.length > 0 ? " Elige un club para entrar." : " Crea tu primer club o únete a uno."}
      </p>

      <div className="lg:grid lg:grid-cols-[1.2fr_1fr] lg:gap-10">
        <div>
          {memberships.length > 0 && (
            <>
              <SectionLabel count={memberships.length}>Tus clubes</SectionLabel>
              <div className="mb-8 flex flex-col gap-2.5">
                {memberships.map((m, i) => (
                  <Link
                    key={m.clubId}
                    href={`/clubs/${m.clubId}`}
                    className="ticket-card rise flex items-center gap-3.5 p-4"
                    style={{ "--i": i } as React.CSSProperties}
                  >
                    <GlassIcon icon={Shield} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-display text-xl leading-tight">{m.club.name}</div>
                      <div className="text-xs text-ink-dim">
                        {m.club._count.memberships} {m.club._count.memberships === 1 ? "miembro" : "miembros"} ·
                        código <span className="font-condensed tracking-[0.15em] text-gold">{m.club.code}</span>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-ink-dim" />
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex flex-col gap-7">
          <div>
            <SectionLabel>Crear club</SectionLabel>
            <div className="mb-2.5 flex items-center gap-3">
              <GlassIcon icon={Plus} size="sm" />
              <p className="text-[12.5px] text-ink-dim">Ponle nombre y comparte el link con tu gente.</p>
            </div>
            <CreateClubForm />
          </div>
          <div>
            <SectionLabel>Unirse con código</SectionLabel>
            <div className="mb-2.5 flex items-center gap-3">
              <GlassIcon icon={KeyRound} tint="cyan" size="sm" />
              <p className="text-[12.5px] text-ink-dim">Si te pasaron un código de 6 letras, va aquí.</p>
            </div>
            <JoinClubForm />
          </div>
        </div>
      </div>
    </main>
  );
}
