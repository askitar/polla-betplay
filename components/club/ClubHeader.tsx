import Link from "next/link";
import { ArrowLeft } from "lucide-react";

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
    <div className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-line bg-pitch/55 px-5 py-4 backdrop-blur-xl [-webkit-backdrop-filter:blur(24px)_saturate(160%)] backdrop-saturate-150">
      <div className="flex items-center gap-3">
        <Link href="/clubs" className="icon-btn" aria-label="Volver a mis clubes">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <div className="font-condensed text-xs tracking-[0.15em] text-gold">LIGA BETPLAY</div>
          <div className="font-display text-2xl leading-tight">{clubName}</div>
        </div>
      </div>
      <Link href={profileHref} className="flex items-center gap-2.5 text-right">
        <div>
          <div className="text-[11px] text-ink-dim">Jugando como</div>
          <div className="text-sm font-semibold">{userName}</div>
        </div>
        <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full border border-line-strong bg-card-hover">
          {userImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={userImage} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center font-condensed text-xs text-ink-dim">
              {userName.slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>
      </Link>
    </div>
  );
}
