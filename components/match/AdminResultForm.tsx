"use client";

import { useState, useTransition } from "react";
import { submitManualResult } from "@/app/clubs/[clubId]/partidos/actions";

export function AdminResultForm({ clubId, matchId }: { clubId: string; matchId: string }) {
  const [home, setHome] = useState("");
  const [away, setAway] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit() {
    if (home === "" || away === "") return;
    setError(null);
    startTransition(async () => {
      try {
        await submitManualResult(clubId, matchId, Number(home), Number(away));
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo guardar.");
      }
    });
  }

  return (
    <div className="mt-3.5 border-t border-dashed border-line-strong pt-3.5">
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="shrink-0 text-[11px] text-ink-dim">ADMIN · cargar resultado:</span>
        <input
          type="number"
          min={0}
          placeholder="0"
          value={home}
          onChange={(e) => setHome(e.target.value)}
          className="mini-input"
        />
        <span className="text-ink-faint">–</span>
        <input
          type="number"
          min={0}
          placeholder="0"
          value={away}
          onChange={(e) => setAway(e.target.value)}
          className="mini-input"
        />
        <button
          onClick={handleSubmit}
          disabled={pending || home === "" || away === ""}
          className="btn-secondary px-3 py-1.5 text-xs"
        >
          {pending ? "Guardando..." : "Guardar"}
        </button>
      </div>
      {error && <p className="mt-1.5 text-xs text-flag-red">{error}</p>}
    </div>
  );
}
