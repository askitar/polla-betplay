import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { ProfileForm } from "@/components/profile/ProfileForm";

export default async function ClubPerfilPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  const [user, teams] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { favoriteTeamId: true },
    }),
    prisma.team.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="mx-auto max-w-lg">
      <SectionLabel hint="tu foto y nombre salen en la tabla">Tu perfil</SectionLabel>
      <div className="card rise p-5">
        <ProfileForm
          name={session.user.name ?? ""}
          email={session.user.email ?? ""}
          image={session.user.image ?? null}
          teams={teams}
          favoriteTeamId={user?.favoriteTeamId ?? null}
        />
      </div>
    </div>
  );
}
