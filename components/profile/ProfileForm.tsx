"use client";

import { useActionState, useRef, useState } from "react";
import { updateProfileAction, type ProfileActionState } from "@/app/profile/actions";

const initialState: ProfileActionState = { error: null };

async function resizeImageToDataUrl(file: File, size = 256): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo procesar la imagen.");

  const scale = Math.max(size / bitmap.width, size / bitmap.height);
  const w = bitmap.width * scale;
  const h = bitmap.height * scale;
  ctx.drawImage(bitmap, (size - w) / 2, (size - h) / 2, w, h);

  return canvas.toDataURL("image/jpeg", 0.85);
}

export function ProfileForm({
  name,
  email,
  image,
  teams,
  favoriteTeamId,
}: {
  name: string;
  email: string;
  image: string | null;
  teams: Array<{ id: string; name: string }>;
  favoriteTeamId: string | null;
}) {
  const [state, formAction, pending] = useActionState(updateProfileAction, initialState);
  const [preview, setPreview] = useState<string | null>(image);
  const [imageValue, setImageValue] = useState("");
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageError(null);
    try {
      const dataUrl = await resizeImageToDataUrl(file);
      setPreview(dataUrl);
      setImageValue(dataUrl);
    } catch {
      setImageError("No se pudo cargar esa imagen, intenta con otra.");
    }
  }

  const initials = (name || "?").slice(0, 2).toUpperCase();

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="image" value={imageValue} />

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-line-strong bg-card-hover"
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center font-display text-xl text-ink-dim">
              {initials}
            </span>
          )}
          <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-[11px] text-ink opacity-0 transition-opacity group-hover:opacity-100">
            Cambiar
          </span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <p className="text-xs text-ink-faint">
          Foto de perfil. Se ve en la tabla de posiciones de tus clubes.
        </p>
      </div>
      {imageError && <p className="text-xs text-flag-red">{imageError}</p>}

      <div>
        <label className="mb-1.5 block text-xs text-ink-dim">Correo</label>
        <input value={email} disabled className="input-field opacity-60" />
      </div>

      <div>
        <label htmlFor="name" className="mb-1.5 block text-xs text-ink-dim">
          Nombre
        </label>
        <input
          id="name"
          name="name"
          defaultValue={name}
          maxLength={30}
          required
          className="input-field"
        />
      </div>

      <div>
        <label htmlFor="favoriteTeamId" className="mb-1.5 block text-xs text-ink-dim">
          Equipo favorito
        </label>
        <select
          id="favoriteTeamId"
          name="favoriteTeamId"
          defaultValue={favoriteTeamId ?? ""}
          className="input-field"
        >
          <option value="">Sin equipo favorito</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
      </div>

      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "Guardando..." : "Guardar cambios"}
      </button>
      {state.error && <p className="text-xs text-flag-red">{state.error}</p>}
    </form>
  );
}
