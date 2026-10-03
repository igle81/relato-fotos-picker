import { readFile } from "node:fs/promises";
import path from "node:path";
import { fetchGoogleMedia, mediaFileUrl } from "@/lib/google-picker";
import type { PickedPhoto } from "@/lib/types";

export type MediaDownload = (
  token: string,
  url: string,
) => Promise<{ bytes: ArrayBuffer; contentType: string }>;

function dataUrl(bytes: Uint8Array, contentType: string) {
  return `data:${contentType};base64,${Buffer.from(bytes).toString("base64")}`;
}

function googleMediaUrl(photo: PickedPhoto) {
  if (photo.googleBaseUrl?.startsWith("https://")) return photo.googleBaseUrl;
  if (
    photo.source === "google_photos" &&
    photo.thumbnailUrl.startsWith("https://")
  ) {
    return photo.thumbnailUrl;
  }
  return undefined;
}

function withoutRemoteUrls(
  photo: PickedPhoto,
  previewDataUrl: string,
  mimeType = photo.mimeType,
): PickedPhoto {
  return {
    id: photo.id,
    filename: photo.filename,
    mimeType,
    type: photo.type,
    width: photo.width,
    height: photo.height,
    createdAt: photo.createdAt,
    thumbnailUrl: previewDataUrl,
    source: photo.source,
    previewDataUrl,
  };
}

async function readDemoFile(publicPath: string) {
  if (!publicPath.startsWith("/demo/")) return null;
  const name = path.basename(publicPath);
  if (!/^[\w.-]+\.svg$/.test(name)) return null;
  try {
    const bytes = await readFile(
      path.join(process.cwd(), "public", "demo", name),
    );
    return dataUrl(bytes, "image/svg+xml");
  } catch {
    return null;
  }
}

export async function prepareHandoffPhotos(
  photos: PickedPhoto[],
  googleToken: string | null,
  download: MediaDownload = fetchGoogleMedia,
) {
  const packed: PickedPhoto[] = [];
  for (const photo of photos.slice(0, 10)) {
    const remote = googleMediaUrl(photo);
    if (remote) {
      if (!googleToken) {
        throw new Error(
          "Falta el permiso de Google para descargar las fotos que elegiste.",
        );
      }
      const { bytes, contentType } = await download(
        googleToken,
        mediaFileUrl(remote, "download", photo.type),
      );
      packed.push(
        withoutRemoteUrls(
          photo,
          dataUrl(new Uint8Array(bytes), contentType),
          contentType || photo.mimeType,
        ),
      );
      continue;
    }

    const inline =
      photo.previewDataUrl?.startsWith("data:")
        ? photo.previewDataUrl
        : photo.thumbnailUrl.startsWith("data:")
          ? photo.thumbnailUrl
          : await readDemoFile(photo.thumbnailUrl);
    if (!inline) {
      throw new Error(`No pude preparar ${photo.filename} sin el permiso de Google.`);
    }
    packed.push(withoutRemoteUrls(photo, inline));
  }
  return packed;
}
