import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Logo } from "@/components/ui/Logo";
import { ProfileForm } from "@/components/profile/ProfileForm";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  return (
    <main className="mx-auto w-full max-w-sm flex-1 px-5 py-10">
      <Logo />
      <p className="mt-2 mb-8 text-[15px] leading-relaxed text-ink-dim">Tu perfil</p>
      <ProfileForm
        name={session.user.name ?? ""}
        email={session.user.email ?? ""}
        image={session.user.image ?? null}
      />
    </main>
  );
}
