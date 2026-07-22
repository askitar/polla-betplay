import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, Lock, Users, Trophy } from "lucide-react";
import { auth } from "@/lib/auth";
import { Logo } from "@/components/ui/Logo";
import { TeamBadge } from "@/components/ui/TeamBadge";
import { TicketDivider } from "@/components/ui/TicketDivider";

export default async function LandingPage() {
  const session = await auth();
  if (session?.user) redirect("/clubs");

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-5 py-12 lg:max-w-3xl lg:py-20">
      <div className="lg:text-center">
        <Logo />
        <p className="mt-3 mb-8 max-w-md text-[15px] leading-relaxed text-ink-dim lg:mx-auto lg:text-lg">
          La polla de predicciones de la Liga BetPlay para tu combo. Crea un club privado,
          predice cada partido antes del pitazo, y compite por el primer puesto.
        </p>
        <Link href="/signin" className="btn-primary inline-flex px-6 py-3 text-base">
          Empezar <ChevronRight size={18} />
        </Link>
      </div>

      <TicketDivider />

      <div className="ticket-card mx-auto max-w-sm p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-xs text-ink-dim">vie · 24 jul · 6:10 p. m.</div>
          <div className="flex items-center gap-1 text-[11px] text-gold-dim">
            <Lock size={11} /> CIERRA EN 10 MIN
          </div>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-1 items-center gap-2">
            <TeamBadge name="Llaneros" uid="landing-home" />
            <span className="text-sm font-semibold">Llaneros</span>
          </div>
          <div className="font-display text-3xl text-gold">2–1</div>
          <div className="flex flex-1 flex-row-reverse items-center gap-2 text-right">
            <TeamBadge name="Deportivo Pereira" uid="landing-away" />
            <span className="text-sm font-semibold">Deportivo Pereira</span>
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-4 lg:grid-cols-3">
        <div className="card">
          <Users size={18} className="text-gold" />
          <p className="mt-2 text-sm text-ink-dim">
            Crea tu club o únete con un código de 6 letras. Las predicciones de los demás quedan
            ocultas hasta que arranca el partido.
          </p>
        </div>
        <div className="card">
          <Lock size={18} className="text-gold" />
          <p className="mt-2 text-sm text-ink-dim">
            Predices el marcador exacto antes del pitazo. Se cierra 10 minutos antes, sin
            excepciones.
          </p>
        </div>
        <div className="card">
          <Trophy size={18} className="text-gold" />
          <p className="mt-2 text-sm text-ink-dim">
            5 puntos por marcador exacto, 2 por acertar el ganador, 1 por acertar el marcador de
            un equipo. Tabla de posiciones siempre actualizada.
          </p>
        </div>
      </div>
    </main>
  );
}
