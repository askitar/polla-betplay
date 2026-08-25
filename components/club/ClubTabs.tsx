"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, CalendarDays, Trophy, Shield, User } from "lucide-react";

export function ClubTabs({ clubId }: { clubId: string }) {
  const pathname = usePathname();

  const tabs = [
    {
      id: "partidos",
      label: "Partidos hoy",
      icon: Calendar,
      href: `/clubs/${clubId}/partidos`,
      active: pathname === `/clubs/${clubId}/partidos`,
    },
    {
      id: "cronograma",
      label: "Cronograma",
      icon: CalendarDays,
      href: `/clubs/${clubId}/cronograma`,
      active: pathname === `/clubs/${clubId}/cronograma`,
    },
    {
      id: "clasificacion",
      label: "Clasificación",
      icon: Trophy,
      href: `/clubs/${clubId}/clasificacion`,
      active: pathname === `/clubs/${clubId}/clasificacion`,
    },
    {
      id: "club",
      label: "Mi club",
      icon: Shield,
      href: `/clubs/${clubId}/club`,
      active: pathname === `/clubs/${clubId}/club`,
    },
    {
      id: "perfil",
      label: "Perfil",
      icon: User,
      href: `/clubs/${clubId}/perfil`,
      active: pathname === `/clubs/${clubId}/perfil`,
    },
  ];

  return (
    <div
      className="fixed inset-x-3.5 bottom-3.5 z-20 flex justify-around gap-1 rounded-[20px] border border-line-strong
        bg-pitch/60 px-1.5 py-2 shadow-[0_14px_40px_rgba(0,0,0,0.5)] backdrop-blur-2xl backdrop-saturate-150
        lg:static lg:inset-auto lg:justify-start lg:gap-1 lg:rounded-none lg:border-0 lg:border-b lg:border-line
        lg:bg-transparent lg:px-5 lg:py-0 lg:shadow-none lg:backdrop-blur-none"
      style={{ bottom: "calc(env(safe-area-inset-bottom) + 14px)" }}
    >
      {tabs.map((t) => (
        <Link
          key={t.id}
          href={t.href}
          className={`flex flex-1 flex-col items-center gap-1 rounded-2xl py-2 font-condensed text-[10.5px] font-semibold tracking-wide transition-colors
            lg:flex-none lg:flex-row lg:gap-1.5 lg:rounded-none lg:border-b-2 lg:px-3.5 lg:py-3 lg:text-[15px] ${
              t.active
                ? "bg-gold/10 text-gold lg:border-gold lg:bg-transparent"
                : "text-ink-dim hover:text-ink lg:border-transparent"
            }`}
        >
          <t.icon size={18} className="lg:hidden" />
          <t.icon size={15} className="hidden lg:block" />
          <span className="lg:uppercase">{t.label}</span>
        </Link>
      ))}
    </div>
  );
}
