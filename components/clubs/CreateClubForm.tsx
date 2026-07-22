"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";
import { createClubAction, type ActionState } from "@/app/clubs/actions";

const initialState: ActionState = { error: null };

export function CreateClubForm() {
  const [state, formAction, pending] = useActionState(createClubAction, initialState);

  return (
    <form action={formAction} className="card flex flex-col gap-3">
      <input
        name="name"
        placeholder="Ej: Polla Oficina Bogotá"
        className="input-field"
        maxLength={40}
        required
      />
      <button type="submit" disabled={pending} className="btn-primary w-full">
        <Plus size={16} /> {pending ? "Creando..." : "Crear mi club"}
      </button>
      {state.error && <p className="text-xs text-flag-red">{state.error}</p>}
    </form>
  );
}
