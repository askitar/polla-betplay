"use client";

import { useState } from "react";
import { Copy, Check, Link as LinkIcon } from "lucide-react";

export function InviteCodeCard({ code, inviteUrl }: { code: string; inviteUrl: string }) {
  const [linkCopied, setLinkCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  async function copyText(text: string, onDone: (v: boolean) => void) {
    try {
      await navigator.clipboard.writeText(text);
      onDone(true);
      setTimeout(() => onDone(false), 1500);
    } catch {
      // clipboard access denied; nothing to fall back to.
    }
  }

  return (
    <div className="card flex flex-col gap-4">
      <div>
        <div className="mb-1.5 flex items-center gap-1.5 text-[11px] tracking-wide text-ink-dim">
          <LinkIcon size={12} /> LINK DE INVITACIÓN
        </div>
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1 truncate rounded-lg border border-line-strong bg-pitch px-3 py-2.5 text-sm text-ink-dim">
            {inviteUrl}
          </div>
          <button
            onClick={() => copyText(inviteUrl, setLinkCopied)}
            className="btn-primary shrink-0 px-3.5 py-2.5 text-[13px]"
          >
            {linkCopied ? (
              <>
                <Check size={15} /> Copiado
              </>
            ) : (
              <>
                <Copy size={15} /> Copiar link
              </>
            )}
          </button>
        </div>
        <p className="mt-2 text-xs text-ink-faint">
          Comparte este link. Quien lo abra y entre con su correo queda directo en el club, sin
          tener que escribir ningún código.
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-dashed border-line-strong pt-4">
        <div>
          <div className="mb-1 text-[11px] tracking-wide text-ink-dim">O CON EL CÓDIGO</div>
          <div className="font-display text-2xl tracking-[0.2em] text-gold">{code}</div>
        </div>
        <button onClick={() => copyText(code, setCodeCopied)} className="btn-secondary shrink-0">
          {codeCopied ? (
            <>
              <Check size={15} /> Copiado
            </>
          ) : (
            <>
              <Copy size={15} /> Copiar
            </>
          )}
        </button>
      </div>
    </div>
  );
}
