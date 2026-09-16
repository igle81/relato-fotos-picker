import { NextResponse } from "next/server";
import { HANDOFF_TTL_MS } from "@/lib/config";
import { corsPreflight, withCors } from "@/lib/cors";
import { fetchGoogleMedia, mediaFileUrl } from "@/lib/google-picker";
import { saveHandoff } from "@/lib/handoff-store";
import { fail } from "@/lib/http";
import type { PickedPhoto, PhotoHandoff } from "@/lib/types";

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

async function withPreview(
  photo: PickedPhoto,
  googleToken: string | null,
): Promise<PickedPhoto> {
  const googleBaseUrl =
    photo.googleBaseUrl ||
    (photo.source === "google_photos" && photo.thumbnailUrl.startsWith("https://")
      ? photo.thumbnailUrl
      : undefined);
  if (photo.previewDataUrl) {
    return { ...photo, googleBaseUrl };
  }
  if (googleBaseUrl && googleToken) {
    try {
      const { bytes, contentType } = await fetchGoogleMedia(
        googleToken,
        mediaFileUrl(googleBaseUrl, "thumb"),
      );
      return {
        ...photo,
        googleBaseUrl,
        previewDataUrl: `data:${contentType};base64,${Buffer.from(bytes).toString("base64")}`,
      };
    } catch {
      return { ...photo, googleBaseUrl };
    }
  }
  if (photo.thumbnailUrl.startsWith("data:")) {
    return { ...photo, previewDataUrl: photo.thumbnailUrl, googleBaseUrl };
  }
  return { ...photo, googleBaseUrl };
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
  const packed: PickedPhoto[] = [];
  for (const photo of photos.slice(0, 10)) {
    packed.push(await withPreview(photo, googleToken));
  }

  const now = Date.now();
  const item: PhotoHandoff = {
    id: crypto.randomUUID(),
    from,
    googleToken,
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
