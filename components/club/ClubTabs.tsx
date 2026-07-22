"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Trophy, Shield } from "lucide-react";

const TABS = [
  { id: "partidos", label: "Partidos", icon: Calendar },
  { id: "clasificacion", label: "Clasificación", icon: Trophy },
  { id: "club", label: "Mi club", icon: Shield },
];

export function ClubTabs({ clubId }: { clubId: string }) {
  const pathname = usePathname();

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-20 flex justify-around border-t border-line bg-pitch
        lg:static lg:justify-start lg:gap-1 lg:border-b lg:border-t-0 lg:px-5"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {TABS.map((t) => {
        const href = `/clubs/${clubId}/${t.id}`;
        const active = pathname === href;
        return (
          <Link
            key={t.id}
            href={href}
            className={`flex flex-1 flex-col items-center gap-1 py-2.5 font-condensed text-[11px] font-semibold tracking-wide transition-colors
              lg:flex-none lg:flex-row lg:gap-1.5 lg:border-b-2 lg:px-3.5 lg:py-3 lg:text-[15px] ${
                active
                  ? "text-gold lg:border-gold"
                  : "text-ink-dim hover:text-ink lg:border-transparent"
              }`}
          >
            <t.icon size={18} className="lg:hidden" />
            <t.icon size={15} className="hidden lg:block" />
            <span className="lg:uppercase">{t.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
