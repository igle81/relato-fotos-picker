import type { PickedPhoto } from "@/lib/types";

export type CompactHandoff = {
  id: string;
  from: "relato" | "mascotas";
  googleToken: string | null;
  photos: Array<{
    id: string;
    filename: string;
    mimeType: string;
    type: "PHOTO" | "VIDEO";
    width?: number;
    height?: number;
    createdAt?: string;
    googleBaseUrl?: string;
    previewDataUrl?: string;
  }>;
};

function bytesToBase64Url(bytes: Uint8Array) {
  let bin = "";
  bytes.forEach((value) => {
    bin += String.fromCharCode(value);
  });
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function compactHandoff(input: {
  id: string;
  from: "relato" | "mascotas";
  googleToken: string | null;
  photos: PickedPhoto[];
}): CompactHandoff {
  return {
    id: input.id,
    from: input.from,
    googleToken: input.googleToken,
    photos: input.photos.slice(0, 10).map((photo) => {
      const googleBaseUrl =
        photo.googleBaseUrl ||
        (photo.source === "google_photos" && photo.thumbnailUrl.startsWith("https://")
          ? photo.thumbnailUrl
          : undefined);
      const previewDataUrl =
        photo.previewDataUrl ||
        (photo.thumbnailUrl.startsWith("data:") ? photo.thumbnailUrl : undefined);
      return {
        id: photo.id,
        filename: photo.filename,
        mimeType: photo.mimeType,
        type: photo.type,
        width: photo.width,
        height: photo.height,
        createdAt: photo.createdAt,
        googleBaseUrl,
        previewDataUrl: googleBaseUrl ? undefined : previewDataUrl,
      };
    }),
  };
}

export function encodeLote(handoff: CompactHandoff) {
  return bytesToBase64Url(new TextEncoder().encode(JSON.stringify(handoff)));
}
