import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { PhotoHandoff, PickedPhoto } from "@/lib/types";

function storePath() {
  if (process.env.RELATO_HANDOFF_PATH) return process.env.RELATO_HANDOFF_PATH;
  if (process.env.VERCEL) return "/tmp/relato-picker-handoff.json";
  return path.join(process.cwd(), "data", "relato-picker-handoff.json");
}

const globalStore = globalThis as typeof globalThis & {
  __relatoHandoffs?: PhotoHandoff[];
  __relatoHandoffChain?: Promise<unknown>;
};

function keptThumb(photo: PickedPhoto) {
  if (photo.previewDataUrl?.startsWith("data:")) return photo.previewDataUrl;
  if (
    photo.thumbnailUrl.startsWith("data:") ||
    photo.thumbnailUrl.startsWith("/")
  ) {
    return photo.thumbnailUrl;
  }
  return "";
}

export function sanitizeHandoff(raw: PhotoHandoff): PhotoHandoff {
  const photos = Array.isArray(raw.photos) ? raw.photos : [];
  return {
    id: String(raw.id),
    from: raw.from === "mascotas" ? "mascotas" : "relato",
    createdAt: raw.createdAt,
    expiresAt: raw.expiresAt,
    photos: photos.map((photo) => {
      const thumb = keptThumb(photo);
      const preview = thumb.startsWith("data:") ? thumb : undefined;
      return {
        id: photo.id,
        filename: photo.filename,
        mimeType: photo.mimeType,
        type: photo.type === "VIDEO" ? "VIDEO" : "PHOTO",
        width: photo.width,
        height: photo.height,
        createdAt: photo.createdAt,
        thumbnailUrl: thumb,
        source: photo.source === "demo" ? "demo" : "google_photos",
        previewDataUrl: preview,
      } satisfies PickedPhoto;
    }),
  };
}

export function toPublicHandoff(item: PhotoHandoff) {
  const clean = sanitizeHandoff(item);
  return {
    id: clean.id,
    from: clean.from,
    photos: clean.photos,
    expiresAt: clean.expiresAt,
  };
}

async function load(): Promise<PhotoHandoff[]> {
  try {
    const raw = await readFile(storePath(), "utf8");
    const parsed = JSON.parse(raw) as { items?: PhotoHandoff[] };
    return Array.isArray(parsed.items) ? parsed.items.map(sanitizeHandoff) : [];
  } catch {
    return [];
  }
}

async function persist(items: PhotoHandoff[]) {
  const clean = items.map(sanitizeHandoff);
  const file = storePath();
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify({ items: clean }, null, 2), "utf8");
  globalStore.__relatoHandoffs = clean;
}

function queue<T>(job: () => Promise<T>): Promise<T> {
  const previous = globalStore.__relatoHandoffChain ?? Promise.resolve();
  const next = previous.then(job, job);
  globalStore.__relatoHandoffChain = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

function fresh(items: PhotoHandoff[], now = Date.now()) {
  return items.filter((item) => new Date(item.expiresAt).getTime() > now);
}

export function resetHandoffMemory() {
  globalStore.__relatoHandoffs = undefined;
  globalStore.__relatoHandoffChain = undefined;
}

export async function saveHandoff(item: PhotoHandoff) {
  return queue(async () => {
    const current = globalStore.__relatoHandoffs ?? (await load());
    const next = fresh([
      sanitizeHandoff(item),
      ...current.filter((entry) => entry.id !== item.id),
    ]).slice(0, 40);
    await persist(next);
    return next.find((entry) => entry.id === item.id) ?? null;
  });
}

/** Reads the handoff once and deletes it, including any expired leftovers. */
export async function takeHandoff(id: string) {
  return queue(async () => {
    const current = globalStore.__relatoHandoffs ?? (await load());
    const alive = fresh(current);
    const item = alive.find((entry) => entry.id === id) ?? null;
    await persist(alive.filter((entry) => entry.id !== id));
    return item;
  });
}

export async function deleteHandoff(id: string) {
  await takeHandoff(id);
}
