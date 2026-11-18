"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck, CalendarDays, Trophy, Shield, UserRound } from "lucide-react";

export function ClubTabs({ clubId }: { clubId: string }) {
  const pathname = usePathname();

  const tabs = [
    { id: "partidos", label: "Partidos", icon: CalendarCheck, href: `/clubs/${clubId}/partidos` },
    { id: "cronograma", label: "Cronograma", icon: CalendarDays, href: `/clubs/${clubId}/cronograma` },
    { id: "clasificacion", label: "Tabla", icon: Trophy, href: `/clubs/${clubId}/clasificacion` },
    { id: "club", label: "Mi club", icon: Shield, href: `/clubs/${clubId}/club` },
    { id: "perfil", label: "Perfil", icon: UserRound, href: `/clubs/${clubId}/perfil` },
  ].map((t) => ({ ...t, active: pathname === t.href }));

  return (
    <nav
      aria-label="Secciones del club"
      className="glass fixed inset-x-3 bottom-3 z-20 flex justify-around gap-1 rounded-[22px] px-1.5 py-1.5 shadow-[0_18px_50px_-10px_rgba(0,0,0,0.75)]
        lg:static lg:inset-auto lg:justify-start lg:gap-1 lg:rounded-none lg:border-x-0 lg:border-t-0 lg:bg-transparent lg:px-6 lg:py-0 lg:shadow-none lg:backdrop-blur-none"
      style={{ bottom: "calc(env(safe-area-inset-bottom) + 12px)" }}
    >
      {tabs.map((t) => (
        <Link
          key={t.id}
          href={t.href}
          aria-current={t.active ? "page" : undefined}
          className={`group relative flex flex-1 flex-col items-center gap-1 rounded-2xl py-2 font-condensed text-[10.5px] font-semibold tracking-wide transition-all duration-300
            lg:flex-none lg:flex-row lg:gap-2 lg:rounded-none lg:border-b-2 lg:px-4 lg:py-3.5 lg:text-[14px] lg:uppercase ${
              t.active
                ? "text-gold lg:border-gold"
                : "text-ink-dim hover:text-ink lg:border-transparent"
            }`}
        >
          {/* Lens: the frosted pill that sits behind the active icon on mobile. */}
          <span
            className={`absolute inset-x-2 top-1 h-9 rounded-xl transition-all duration-300 lg:hidden ${
              t.active
                ? "bg-gradient-to-b from-white/[0.14] to-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_8px_18px_-8px_rgb(var(--accent-rgb)/0.7)] ring-1 ring-gold/40"
                : "opacity-0 group-active:opacity-60"
            }`}
            aria-hidden
          />
          <t.icon
            size={19}
            strokeWidth={t.active ? 2.4 : 2}
            className={`relative transition-transform duration-300 lg:hidden ${t.active ? "-translate-y-px drop-shadow-[0_0_8px_rgb(var(--accent-rgb)/0.7)]" : ""}`}
          />
          <t.icon size={15} className="hidden lg:block" />
          <span className="relative">{t.label}</span>
        </Link>
      ))}
    </nav>
  );
}
