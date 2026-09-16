import { NextResponse } from "next/server";
import { MAX_CANDIDATES } from "@/lib/config";
import { fetchGoogleMedia, mediaFileUrl } from "@/lib/google-picker";
import { bearerToken, fail } from "@/lib/http";
import { rankPickedPhotos } from "@/lib/tray";
import { updateStore } from "@/lib/store";
import type { PickedPhoto, TrayItem } from "@/lib/types";

async function toStoredPhoto(
  photo: PickedPhoto,
  token: string | null,
): Promise<PickedPhoto> {
  if (photo.source === "demo") return photo;
  if (
    photo.thumbnailUrl.startsWith("data:") ||
    photo.thumbnailUrl.startsWith("/")
  ) {
    return photo;
  }
  if (!token) return photo;
  const { bytes, contentType } = await fetchGoogleMedia(
    token,
    mediaFileUrl(photo.thumbnailUrl, "thumb"),
  );
  return {
    ...photo,
    thumbnailUrl: `data:${contentType};base64,${Buffer.from(bytes).toString("base64")}`,
  };
}

export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  if (!token) return fail("Falta el enlace de invitación.");

  let payload: { photos?: PickedPhoto[] };
  try {
    payload = (await request.json()) as { photos?: PickedPhoto[] };
  } catch {
    return fail("Cuerpo JSON no válido.");
  }
  const photos = Array.isArray(payload.photos) ? payload.photos : [];
  if (photos.length === 0) return fail("Elige al menos una foto.");

  const googleToken = bearerToken(request);
  const stored: PickedPhoto[] = [];
  for (const photo of photos) {
    stored.push(await toStoredPhoto(photo, googleToken));
  }

  let added = 0;
  let skipped = 0;
  let room = 0;
  try {
    await updateStore((current) => {
      const invite = current.invites.find((item) => item.token === token);
      if (!invite) {
        throw new Error("Ese enlace no existe o ya no vale.");
      }
      if (new Date(invite.expiresAt).getTime() < Date.now()) {
        throw new Error("Este enlace ha caducado. Pide otro correo a Relato.");
      }
      const pending = current.tray.filter((item) => item.status === "pending");
      room = Math.max(0, MAX_CANDIDATES - pending.length);
      const ranked = rankPickedPhotos(stored, room).filter(
        (photo) => !current.tray.some((item) => item.id === photo.id),
      );
      const incoming: TrayItem[] = ranked.map((photo) => ({
        ...photo,
        status: "pending",
        authorYes: false,
        tutorYes: false,
        addedAt: new Date().toISOString(),
        inviteToken: token,
      }));
      added = incoming.length;
      skipped = stored.length - incoming.length;
      return {
        invites: current.invites.map((item) =>
          item.token === token
            ? { ...item, completedAt: new Date().toISOString() }
            : item,
        ),
        tray: [...incoming, ...current.tray],
      };
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No pude guardar las fotos.";
    const status = /no existe|caducado/i.test(message) ? 404 : 400;
    return fail(message, status);
  }

  if (added === 0) {
    return fail(
      room === 0
        ? `La bandeja de Relato ya tiene ${MAX_CANDIDATES} pendientes.`
        : "Esas fotos ya estaban en la bandeja.",
      409,
    );
  }

  return NextResponse.json({
    added,
    skipped,
    notice: `Entraron ${added} fotos a la bandeja de Relato como pendientes. No se publican solas.`,
  });
}
