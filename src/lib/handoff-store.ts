import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { PhotoHandoff } from "@/lib/types";

function storePath() {
  if (process.env.RELATO_HANDOFF_PATH) return process.env.RELATO_HANDOFF_PATH;
  if (process.env.VERCEL) return "/tmp/relato-picker-handoff.json";
  return path.join(process.cwd(), "data", "relato-picker-handoff.json");
}

const globalStore = globalThis as typeof globalThis & {
  __relatoHandoffs?: PhotoHandoff[];
  __relatoHandoffChain?: Promise<unknown>;
};

async function load(): Promise<PhotoHandoff[]> {
  try {
    const raw = await readFile(storePath(), "utf8");
    const parsed = JSON.parse(raw) as { items?: PhotoHandoff[] };
    return Array.isArray(parsed.items) ? parsed.items : [];
  } catch {
    return [];
  }
}

async function persist(items: PhotoHandoff[]) {
  const file = storePath();
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify({ items }, null, 2), "utf8");
  globalStore.__relatoHandoffs = items;
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

function alive(item: PhotoHandoff) {
  return (
    !item.consumedAt && new Date(item.expiresAt).getTime() > Date.now()
  );
}

export async function saveHandoff(item: PhotoHandoff) {
  return queue(async () => {
    const current = globalStore.__relatoHandoffs ?? (await load());
    const next = [item, ...current.filter(alive)].slice(0, 40);
    await persist(next);
    return item;
  });
}

export async function readHandoff(id: string) {
  return queue(async () => {
    const current = globalStore.__relatoHandoffs ?? (await load());
    globalStore.__relatoHandoffs = current;
    return current.find((item) => item.id === id && alive(item)) ?? null;
  });
}

export async function consumeHandoff(id: string) {
  return queue(async () => {
    const current = globalStore.__relatoHandoffs ?? (await load());
    const next = current.map((item) =>
      item.id === id
        ? { ...item, consumedAt: new Date().toISOString() }
        : item,
    );
    await persist(next);
  });
}
