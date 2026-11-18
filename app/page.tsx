import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, Lock, Users, Trophy, Timer, Sparkles, ShieldCheck } from "lucide-react";
import { auth } from "@/lib/auth";
import { Logo } from "@/components/ui/Logo";
import { Ball3D } from "@/components/ui/Ball3D";
import { TeamBadge } from "@/components/ui/TeamBadge";
import { GlassIcon } from "@/components/ui/GlassIcon";
import { Tilt } from "@/components/ui/Tilt";

const STEPS = [
  { icon: Users, title: "Arma tu club", desc: "Créalo en un minuto y comparte un link. Quien lo abra entra directo." },
  { icon: Timer, title: "Predice antes del pitazo", desc: "Marcador exacto por partido. Se cierra 10 minutos antes, para todos igual." },
  { icon: Trophy, title: "Sube en la tabla", desc: "5 por exacto, 2 por ganador, 1 por goles de un equipo. Se actualiza sola." },
];

export default async function LandingPage() {
  const session = await auth();
  if (session?.user) redirect("/clubs");

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 pb-16 pt-6 sm:pt-8">
      <header className="flex items-center justify-between">
        <Logo compact />
        <Link href="/signin" className="btn-secondary px-4 py-2 text-[13px]">
          Entrar
        </Link>
      </header>

      <section className="mt-12 grid items-center gap-10 lg:mt-20 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
        <div className="rise">
          <span className="chip chip-gold">
            <Sparkles size={11} /> Liga BetPlay 2026-II
          </span>
          <h1 className="mt-4 font-display text-[44px] leading-[0.95] sm:text-[60px] lg:text-[64px] xl:text-[72px]">
            La polla de la liga,
            <br />
            <span className="num-gold">entre tu combo.</span>
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-ink-dim sm:text-lg">
            Un club privado, un marcador por partido y una tabla que se mueve sola cada fecha.
            Sin hojas de cálculo ni discusiones de quién puso qué.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link href="/signin" className="btn-primary px-6 py-3 text-base">
              Empezar gratis <ChevronRight size={18} />
            </Link>
            <span className="flex items-center gap-1.5 text-xs text-ink-faint">
              <ShieldCheck size={13} /> Entras con tu correo, sin contraseña
            </span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-sm rise" style={{ "--i": 2 } as React.CSSProperties}>
          <div className="pointer-events-none absolute -right-6 -top-10 z-10 hidden sm:block">
            <Ball3D size={110} />
          </div>
          <Tilt max={8}>
            <div className="ticket-card relative p-5">
              <span className="glare" aria-hidden />
              <div className="absolute -top-3 left-4 rounded-full bg-gradient-to-b from-gold-bright to-gold px-2.5 py-0.5 font-condensed text-[11px] font-bold tracking-[0.12em] text-pitch">
                PRÓXIMO
              </div>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-ink-dim">
                  <span className="chip chip-gold">Fecha 18</span> vie · 6:00 p. m.
                </div>
                <span className="chip">
                  <Lock size={11} /> cierra en 10 min
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-1 flex-col items-center gap-1.5 text-center">
                  <TeamBadge name="Boyacá Chicó" uid="landing-home" size={46} />
                  <span className="text-[12px] font-semibold">Boyacá Chicó</span>
                </div>
                <div className="flex items-center gap-2.5 font-display text-[44px] leading-none">
                  <span className="num-gold">1</span>
                  <span className="text-xl text-line-strong">–</span>
                  <span className="num-gold">2</span>
                </div>
                <div className="flex flex-1 flex-col items-center gap-1.5 text-center">
                  <TeamBadge name="Internacional de Bogotá" uid="landing-away" size={46} />
                  <span className="text-[12px] font-semibold">Inter de Bogotá</span>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-dashed border-white/10 pt-3 text-xs text-ink-dim">
                <span>7 de 9 ya predijeron</span>
                <span className="chip chip-cyan">Guardada</span>
              </div>
            </div>
          </Tilt>
        </div>
      </section>

      <section className="mt-20 grid gap-4 sm:grid-cols-3">
        {STEPS.map((s, i) => (
          <div key={s.title} className="card rise flex flex-col gap-3" style={{ "--i": i + 3 } as React.CSSProperties}>
            <div className="flex items-center justify-between">
              <GlassIcon icon={s.icon} size="lg" />
              <span className="font-display text-3xl text-white/10">0{i + 1}</span>
            </div>
            <div className="font-display text-xl">{s.title}</div>
            <p className="text-sm leading-relaxed text-ink-dim">{s.desc}</p>
          </div>
        ))}
      </section>

      <section className="card mt-10 flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
        <div>
          <div className="font-display text-2xl">Liga y cuadrangulares, cada uno con su tabla.</div>
          <p className="mt-1 text-sm text-ink-dim">
            La polla de la liga va por las 19 fechas del todos contra todos. Los cuadrangulares y la
            final son una polla aparte que arranca desde cero, con las mismas reglas, para quien
            quiera entrar.
          </p>
        </div>
        <Link href="/signin" className="btn-primary shrink-0 px-6 py-3">
          Crear mi club
        </Link>
      </section>

      <footer className="mt-12 text-center text-[11px] text-ink-faint">
        Hecho para la gente que ve la Liga con la familia y los amigos.
      </footer>
    </main>
  );
}
