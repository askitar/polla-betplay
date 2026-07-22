"use client";

import { useActionState } from "react";
import { joinClubAction, type ActionState } from "@/app/clubs/actions";

const initialState: ActionState = { error: null };

export function JoinClubForm() {
  const [state, formAction, pending] = useActionState(joinClubAction, initialState);

  return (
    <form action={formAction} className="card flex flex-col gap-3">
      <input
        name="code"
        placeholder="CÓDIGO DE 6 LETRAS"
        maxLength={6}
        required
        className="input-field text-center font-display text-lg tracking-[0.3em] uppercase"
      />
      <button type="submit" disabled={pending} className="btn-secondary w-full">
        {pending ? "Uniéndome..." : "Unirme al club"}
      </button>
      {state.error && <p className="text-xs text-flag-red">{state.error}</p>}
    </form>
  );
}
