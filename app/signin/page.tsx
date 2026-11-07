import { Mail, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { GlassIcon } from "@/components/ui/GlassIcon";
import { signIn } from "@/lib/auth";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  async function handleSignIn(formData: FormData) {
    "use server";
    await signIn("resend", {
      email: formData.get("email"),
      redirectTo: callbackUrl || "/clubs",
    });
  }

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-5 py-10">
      <div className="mb-8 flex justify-center">
        <Logo />
      </div>
      <div className="card rise p-6">
        <div className="mb-4 flex items-center gap-3">
          <GlassIcon icon={Mail} size="lg" />
          <div>
            <div className="font-display text-2xl leading-tight">Entrar</div>
            <div className="text-[13px] text-ink-dim">Te mandamos un enlace al correo.</div>
          </div>
        </div>
        <form action={handleSignIn} className="flex flex-col gap-3">
          <input
            type="email"
            name="email"
            required
            placeholder="tu@correo.com"
            className="input-field"
            autoFocus
            autoComplete="email"
          />
          <button type="submit" className="btn-primary w-full py-3">
            Enviarme el enlace
          </button>
        </form>
        <p className="mt-4 flex items-center gap-1.5 text-[11.5px] text-ink-faint">
          <ShieldCheck size={13} /> Sin contraseñas. El enlace sirve una vez y dura 24 horas.
        </p>
      </div>
    </main>
  );
}
