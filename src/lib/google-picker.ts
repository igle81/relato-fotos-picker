import type { PickedPhoto, PickingSession } from "@/lib/types";

const PICKER_BASE = "https://photospicker.googleapis.com/v1";

export function parseDurationMs(value: string | undefined, fallback: number) {
  if (!value) return fallback;
  const match = value.match(/^([\d.]+)s$/i);
  if (!match) return fallback;
  return Math.max(250, Math.round(Number(match[1]) * 1000));
}

export function sessionPathId(id: string) {
  return id.startsWith("sessions/") ? id.slice("sessions/".length) : id;
}

type GoogleErrorBody = {
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
};

export function explainGoogleError(status: number, body: unknown) {
  const error = (body as GoogleErrorBody)?.error;
  const message = error?.message ?? "";
  const code = error?.status ?? "";

  if (status === 401 || code === "UNAUTHENTICATED") {
    return "La sesión de Google caducó. Vuelve a conectar la cuenta.";
  }
  if (
    status === 403 &&
    /has not been used|disabled|not been enabled|API has not been/i.test(
      message,
    )
  ) {
    return "Activa la Google Photos Picker API en Google Cloud Console para este proyecto.";
  }
  if (status === 403 || code === "PERMISSION_DENIED") {
    return "Google no deja listar el rollo entero. El Picker sí: hay que elegir las fotos a mano. Revisa el alcance photospicker.mediaitems.readonly.";
  }
  if (status === 400 && /FAILED_PRECONDITION|no Google Photos/i.test(message + code)) {
    return "Esta cuenta de Google no tiene Google Fotos. Abre photos.google.com una vez e inténtalo de nuevo.";
  }
  if (code === "FAILED_PRECONDITION") {
    return "Esta cuenta de Google no tiene Google Fotos. Abre photos.google.com una vez e inténtalo de nuevo.";
  }
  if (status === 400 || code === "INVALID_ARGUMENT") {
    return message || "Google rechazó la petición del Picker.";
  }
  return message || `Google respondió ${status}.`;
}

async function googleJson(
  token: string,
  url: string,
  init?: RequestInit,
): Promise<{ status: number; body: unknown }> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  const text = await response.text();
  let body: unknown = {};
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { error: { message: text.slice(0, 400) } };
    }
  }
  return { status: response.status, body };
}

export async function createPickingSession(
  token: string,
  maxItemCount: number,
): Promise<PickingSession> {
  const { status, body } = await googleJson(token, `${PICKER_BASE}/sessions`, {
    method: "POST",
    body: JSON.stringify({
      pickingConfig: { maxItemCount: String(maxItemCount) },
    }),
  });
  if (status < 200 || status >= 300) {
    throw new Error(explainGoogleError(status, body));
  }
  const raw = body as {
    id?: string;
    pickerUri?: string;
    mediaItemsSet?: boolean;
    pollingConfig?: { pollInterval?: string; timeoutIn?: string };
    expireTime?: string;
  };
  if (!raw.id || !raw.pickerUri) {
    throw new Error("Google no devolvió una sesión de Picker.");
  }
  return {
    id: sessionPathId(raw.id),
    pickerUri: raw.pickerUri,
    mediaItemsSet: Boolean(raw.mediaItemsSet),
    pollIntervalMs: parseDurationMs(raw.pollingConfig?.pollInterval, 2000),
    timeoutInMs: parseDurationMs(raw.pollingConfig?.timeoutIn, 300000),
    expireTime: raw.expireTime,
  };
}

export async function getPickingSession(token: string, id: string) {
  const { status, body } = await googleJson(
    token,
    `${PICKER_BASE}/sessions/${encodeURIComponent(sessionPathId(id))}`,
  );
  if (status < 200 || status >= 300) {
    throw new Error(explainGoogleError(status, body));
  }
  const raw = body as {
    id?: string;
    pickerUri?: string;
    mediaItemsSet?: boolean;
    pollingConfig?: { pollInterval?: string; timeoutIn?: string };
    expireTime?: string;
  };
  return {
    id: sessionPathId(raw.id ?? id),
    pickerUri: raw.pickerUri ?? "",
    mediaItemsSet: Boolean(raw.mediaItemsSet),
    pollIntervalMs: parseDurationMs(raw.pollingConfig?.pollInterval, 2000),
    timeoutInMs: parseDurationMs(raw.pollingConfig?.timeoutIn, 0),
    expireTime: raw.expireTime,
  } satisfies PickingSession;
}

type PickedMediaItem = {
  id?: string;
  createTime?: string;
  type?: string;
  mediaFile?: {
    baseUrl?: string;
    mimeType?: string;
    filename?: string;
    mediaFileMetadata?: {
      width?: number;
      height?: number;
    };
  };
};

export async function listPickedItems(
  token: string,
  sessionId: string,
  limit: number,
): Promise<PickedPhoto[]> {
  const items: PickedPhoto[] = [];
  let pageToken = "";
  do {
    const params = new URLSearchParams({
      sessionId: sessionPathId(sessionId),
      pageSize: "100",
    });
    if (pageToken) params.set("pageToken", pageToken);
    const { status, body } = await googleJson(
      token,
      `${PICKER_BASE}/mediaItems?${params.toString()}`,
    );
    if (status < 200 || status >= 300) {
      throw new Error(explainGoogleError(status, body));
    }
    const raw = body as {
      mediaItems?: PickedMediaItem[];
      nextPageToken?: string;
    };
    for (const item of raw.mediaItems ?? []) {
      const file = item.mediaFile;
      if (!item.id || !file?.baseUrl) continue;
      const type = item.type === "VIDEO" ? "VIDEO" : "PHOTO";
        items.push({
          id: item.id,
          filename: file.filename || `${type.toLowerCase()}-${item.id}`,
          mimeType: file.mimeType || (type === "VIDEO" ? "video/mp4" : "image/jpeg"),
          type,
          width: file.mediaFileMetadata?.width,
          height: file.mediaFileMetadata?.height,
          createdAt: item.createTime,
          thumbnailUrl: file.baseUrl,
          googleBaseUrl: file.baseUrl,
          source: "google_photos",
        });
      if (items.length >= limit) return items;
    }
    pageToken = raw.nextPageToken ?? "";
  } while (pageToken);
  return items;
}

export function pickerOpenUrl(pickerUri: string) {
  const trimmed = pickerUri.replace(/\/$/, "");
  return trimmed.endsWith("/autoclose") ? trimmed : `${trimmed}/autoclose`;
}

export function mediaFileUrl(baseUrl: string, variant: "thumb" | "download") {
  const clean = baseUrl.split("=")[0];
  return variant === "thumb" ? `${clean}=w512-h512` : `${clean}=d`;
}

export async function fetchGoogleMedia(
  token: string,
  url: string,
): Promise<{ bytes: ArrayBuffer; contentType: string }> {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(
      `No pude bajar el archivo de Google Fotos (${response.status}).`,
    );
  }
  return {
    bytes: await response.arrayBuffer(),
    contentType: response.headers.get("content-type") || "application/octet-stream",
  };
}
