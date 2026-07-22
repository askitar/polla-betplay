import { Logo } from "@/components/ui/Logo";

export default function VerifyRequestPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-5 py-10 text-center">
      <Logo />
      <p className="mt-6 text-[15px] leading-relaxed text-ink-dim">
        Te enviamos un enlace a tu correo. Ábrelo desde este mismo dispositivo para entrar.
        Si no te llega en un par de minutos, revisa la carpeta de spam.
      </p>
    </main>
  );
}
