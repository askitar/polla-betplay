"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteClubAction } from "@/app/clubs/[clubId]/club/actions";

export function DeleteClubButton({ clubId, clubName }: { clubId: string; clubName: string }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      try {
        await deleteClubAction(clubId);
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo eliminar.");
      }
    });
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="btn-secondary border-flag-red/50 text-flag-red hover:bg-flag-red/10"
      >
        <Trash2 size={14} /> Eliminar club
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-flag-red/40 bg-flag-red/10 p-3.5">
      <p className="text-[13px] text-ink">
        ¿Seguro que quieres eliminar <span className="font-semibold">{clubName}</span>? Se borran
        el club y las membresías de todos los que estén adentro. Las predicciones de cada quien no
        se pierden, siguen contando en sus otros clubes.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          onClick={handleDelete}
          disabled={pending}
          className="btn-secondary border-flag-red/50 text-flag-red hover:bg-flag-red/10"
        >
          {pending ? "Eliminando..." : "Sí, eliminar"}
        </button>
        <button onClick={() => setConfirming(false)} disabled={pending} className="btn-secondary">
          Cancelar
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-flag-red">{error}</p>}
    </div>
  );
}
