import { redirect } from "next/navigation";

export default async function ClubIndexPage({
  params,
}: {
  params: Promise<{ clubId: string }>;
}) {
  const { clubId } = await params;
  redirect(`/clubs/${clubId}/partidos`);
}
