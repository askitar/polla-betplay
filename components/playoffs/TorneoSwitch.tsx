import Link from "next/link";
import type { Torneo } from "@/lib/club-data";

/** Cuadrangulares | Liga toggle, so the finished league stays reachable. */
export function TorneoSwitch({ basePath, current }: { basePath: string; current: Torneo }) {
  const items: Array<{ key: Torneo; label: string; href: string }> = [
    { key: "cuadrangulares", label: "Cuadrangulares", href: basePath },
    { key: "liga", label: "Liga (terminada)", href: `${basePath}?torneo=liga` },
  ];
  return (
    <div className="seg mb-5 inline-flex">
      {items.map((it) => (
        <Link
          key={it.key}
          href={it.href}
          className="seg-item"
          data-active={current === it.key}
          aria-current={current === it.key ? "page" : undefined}
        >
          {it.label}
        </Link>
      ))}
    </div>
  );
}

export function resolveTorneo(active: boolean, param: string | string[] | undefined): Torneo {
  if (!active) return "liga";
  return param === "liga" ? "liga" : "cuadrangulares";
}
