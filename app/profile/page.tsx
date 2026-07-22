import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { Logo } from "@/components/ui/Logo";
import { ProfileForm } from "@/components/profile/ProfileForm";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  return (
    <main className="mx-auto w-full max-w-sm flex-1 px-5 py-10">
      <Link
        href="/clubs"
        className="icon-btn mb-5 inline-flex"
        aria-label="Volver a mis clubes"
      >
        <ArrowLeft size={16} />
      </Link>
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
