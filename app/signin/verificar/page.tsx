import { MailCheck } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { GlassIcon } from "@/components/ui/GlassIcon";

export default function VerifyRequestPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-5 py-10">
      <div className="mb-8 flex justify-center">
        <Logo />
      </div>
      <div className="card rise flex flex-col items-center p-7 text-center">
        <GlassIcon icon={MailCheck} tint="cyan" size="xl" />
        <div className="mt-4 font-display text-2xl">Revisa tu correo</div>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-dim">
          Te enviamos el enlace. Ábrelo desde este mismo dispositivo para entrar. Si en un par de
          minutos no llega, mira en spam.
        </p>
      </div>
    </main>
  );
}
