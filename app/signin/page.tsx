import { Logo } from "@/components/ui/Logo";
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
      <Logo />
      <p className="mt-2 mb-8 text-[15px] leading-relaxed text-ink-dim">
        Escribe tu correo y te enviamos un enlace para entrar. Sin contraseñas que recordar.
      </p>
      <form action={handleSignIn} className="flex flex-col gap-3">
        <input
          type="email"
          name="email"
          required
          placeholder="tu@correo.com"
          className="input-field"
          autoFocus
        />
        <button type="submit" className="btn-primary w-full">
          Enviarme el enlace
        </button>
      </form>
    </main>
  );
}
