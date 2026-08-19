"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, CalendarDays, Trophy, Shield, User } from "lucide-react";

export function ClubTabs({ clubId }: { clubId: string }) {
  const pathname = usePathname();

  const tabs = [
    {
      id: "partidos",
      label: "Partidos",
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
      className="fixed inset-x-0 bottom-0 z-20 flex justify-around border-t border-line bg-pitch
        lg:static lg:justify-start lg:gap-1 lg:border-b lg:border-t-0 lg:px-5"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {tabs.map((t) => (
        <Link
          key={t.id}
          href={t.href}
          className={`flex flex-1 flex-col items-center gap-1 py-2.5 font-condensed text-[11px] font-semibold tracking-wide transition-colors
            lg:flex-none lg:flex-row lg:gap-1.5 lg:border-b-2 lg:px-3.5 lg:py-3 lg:text-[15px] ${
              t.active ? "text-gold lg:border-gold" : "text-ink-dim hover:text-ink lg:border-transparent"
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
