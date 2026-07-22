import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function ClubHeader({
  clubName,
  userName,
}: {
  clubName: string;
  userName: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
      <div className="flex items-center gap-3">
        <Link href="/clubs" className="icon-btn" aria-label="Volver a mis clubes">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <div className="font-condensed text-xs tracking-[0.15em] text-gold">LIGA BETPLAY</div>
          <div className="font-display text-2xl leading-tight">{clubName}</div>
        </div>
      </div>
      <div className="text-right">
        <div className="text-[11px] text-ink-dim">Jugando como</div>
        <div className="text-sm font-semibold">{userName}</div>
      </div>
    </div>
  );
}
