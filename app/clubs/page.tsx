import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Logo } from "@/components/ui/Logo";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { TicketDivider } from "@/components/ui/TicketDivider";
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
    <main className="mx-auto w-full max-w-md flex-1 px-5 py-10">
      <Logo />
      <p className="mt-2 mb-8 text-[15px] leading-relaxed text-ink-dim">
        Hola, <span className="font-semibold text-ink">{session.user.name}</span>. Estos son tus
        clubes.
      </p>

      {memberships.length > 0 && (
        <>
          <SectionLabel>Tus clubes</SectionLabel>
          <div className="mb-2 flex flex-col gap-2">
            {memberships.map((m) => (
              <Link
                key={m.clubId}
                href={`/clubs/${m.clubId}`}
                className="ticket-card flex items-center justify-between gap-3 p-4 transition-colors hover:bg-card-hover"
              >
                <div>
                  <div className="font-semibold">{m.club.name}</div>
                  <div className="text-xs text-ink-dim">
                    {m.club._count.memberships} miembros · código {m.club.code}
                  </div>
                </div>
                <ChevronRight size={18} className="text-ink-dim" />
              </Link>
            ))}
          </div>
          <TicketDivider />
        </>
      )}

      <SectionLabel>Crear club</SectionLabel>
      <CreateClubForm />

      <TicketDivider />

      <SectionLabel>Unirse con código</SectionLabel>
      <JoinClubForm />
    </main>
  );
}
