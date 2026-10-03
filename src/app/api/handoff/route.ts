import { NextResponse } from "next/server";
import { HANDOFF_TTL_MS } from "@/lib/config";
import { corsPreflight, withCors } from "@/lib/cors";
import { saveHandoff } from "@/lib/handoff-store";
import { fail } from "@/lib/http";
import { prepareHandoffPhotos } from "@/lib/prepare-handoff";
import type { PickedPhoto, PhotoHandoff } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function POST(request: Request) {
  let payload: {
    from?: "relato" | "mascotas";
    googleToken?: string | null;
    photos?: PickedPhoto[];
  };
  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return withCors(request, fail("Cuerpo JSON no válido."));
  }

  const from = payload.from === "mascotas" ? "mascotas" : "relato";
  const photos = Array.isArray(payload.photos) ? payload.photos : [];
  if (photos.length === 0) {
    return withCors(request, fail("No hay fotos para pasar a Relato."));
  }

  const googleToken = payload.googleToken?.trim() || null;
  let packed: PickedPhoto[];
  try {
    packed = await prepareHandoffPhotos(photos, googleToken);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No pude descargar las fotos elegidas.";
    return withCors(request, fail(message, 502));
  }

  const now = Date.now();
  const item: PhotoHandoff = {
    id: crypto.randomUUID(),
    from,
    photos: packed,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + HANDOFF_TTL_MS).toISOString(),
  };
  await saveHandoff(item);

  return withCors(
    request,
    NextResponse.json({
      id: item.id,
      expiresAt: item.expiresAt,
      count: packed.length,
    }),
  );
}
