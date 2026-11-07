import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Ball3D } from "@/components/ui/Ball3D";

export function ClubHeader({
  clubId,
  clubName,
  userName,
  userImage,
}: {
  clubId: string;
  clubName: string;
  userName: string;
  userImage?: string | null;
}) {
  const profileHref = `/clubs/${clubId}/perfil`;

  return (
    <div className="glass sticky top-0 z-30 flex items-center justify-between gap-3 border-x-0 border-t-0 px-4 py-3 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <Link href="/clubs" className="icon-btn shrink-0" aria-label="Volver a mis clubes">
          <ArrowLeft size={16} />
        </Link>
        <Ball3D size={28} float={false} shadow={false} className="hidden sm:inline-flex" />
        <div className="min-w-0">
          <div className="eyebrow text-[10.5px]">LIGA BETPLAY · 2026-II</div>
          <div className="truncate font-display text-[22px] leading-tight sm:text-2xl">{clubName}</div>
        </div>
      </div>
      <Link
        href={profileHref}
        className="group flex shrink-0 items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.04] py-1 pl-3 pr-1 text-right transition hover:border-gold/40 hover:bg-white/[0.07]"
      >
        <div className="hidden sm:block">
          <div className="text-[10.5px] leading-tight text-ink-faint">Jugando como</div>
          <div className="text-sm font-semibold leading-tight">{userName}</div>
        </div>
        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-white/15 bg-card-hover shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_6px_14px_-6px_rgba(0,0,0,0.8)] transition group-hover:ring-2 group-hover:ring-gold/40">
          {userImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={userImage} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center font-condensed text-xs font-semibold text-ink-dim">
              {userName.slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>
      </Link>
    </div>
  );
}
