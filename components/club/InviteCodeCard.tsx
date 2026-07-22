"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function InviteCodeCard({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard access denied; nothing to fall back to.
    }
  }

  return (
    <div className="card flex items-center justify-between gap-3">
      <div className="font-display text-3xl tracking-[0.2em] text-gold">{code}</div>
      <button onClick={handleCopy} className="btn-secondary">
        {copied ? (
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
  );
}
