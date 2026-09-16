import type { PickedPhoto, TrayItem } from "@/lib/types";
import { MAX_CANDIDATES } from "@/lib/config";

export const TRAY_KEY = "relato-fotos-picker-tray";

export function readTray(): TrayItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(TRAY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as TrayItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeTray(items: TrayItem[]) {
  window.localStorage.setItem(TRAY_KEY, JSON.stringify(items));
}

export function addCandidatesToTray(photos: PickedPhoto[]) {
  const current = readTray();
  const pending = current.filter((item) => item.status === "pending");
  const room = Math.max(0, MAX_CANDIDATES - pending.length);
  const incoming = photos.slice(0, room).filter(
    (photo) => !current.some((item) => item.id === photo.id),
  );
  const next: TrayItem[] = [
    ...incoming.map((photo) => ({
      ...photo,
      googleBaseUrl:
        photo.googleBaseUrl ||
        (photo.source === "google_photos" && photo.thumbnailUrl.startsWith("https://")
          ? photo.thumbnailUrl
          : photo.googleBaseUrl),
      status: "pending" as const,
      authorYes: false,
      tutorYes: false,
      addedAt: new Date().toISOString(),
    })),
    ...current,
  ];
  writeTray(next);
  return {
    added: incoming.length,
    skipped: photos.length - incoming.length,
    tray: next,
  };
}

export function rejectTrayItem(id: string) {
  const next = readTray().map((item) =>
    item.id === id ? { ...item, status: "rejected" as const } : item,
  );
  writeTray(next);
  return next;
}

export function clearRejected() {
  const next = readTray().filter((item) => item.status === "pending");
  writeTray(next);
  return next;
}

export function setTrayVote(
  id: string,
  role: "authorYes" | "tutorYes",
  value: boolean,
) {
  const next = readTray().map((item) =>
    item.id === id ? { ...item, [role]: value } : item,
  );
  writeTray(next);
  return next;
}

export function pendingCount(items: TrayItem[]) {
  return items.filter((item) => item.status === "pending").length;
}

export function rankPickedPhotos(photos: PickedPhoto[], limit: number) {
  return [...photos]
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
    .slice(0, limit);
}
