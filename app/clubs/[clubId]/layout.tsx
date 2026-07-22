import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ClubHeader } from "@/components/club/ClubHeader";
import { ClubTabs } from "@/components/club/ClubTabs";

export default async function ClubLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ clubId: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  const { clubId } = await params;
  const membership = await prisma.membership.findUnique({
    where: { userId_clubId: { userId: session.user.id, clubId } },
    include: { club: true },
  });
  if (!membership) notFound();

  return (
    <div className="flex flex-1 flex-col">
      <ClubHeader clubName={membership.club.name} userName={session.user.name ?? ""} />
      <ClubTabs clubId={clubId} />
      <div className="mx-auto w-full max-w-3xl flex-1 px-5 pt-6 pb-24 lg:max-w-5xl lg:pb-6">
        {children}
      </div>
    </div>
  );
}
