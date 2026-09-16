import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Invite, TrayItem } from "@/lib/types";

export type RelatoStore = {
  invites: Invite[];
  tray: TrayItem[];
};

const EMPTY: RelatoStore = { invites: [], tray: [] };

function storePath() {
  if (process.env.RELATO_STORE_PATH) return process.env.RELATO_STORE_PATH;
  if (process.env.VERCEL) return "/tmp/relato-picker-store.json";
  return path.join(process.cwd(), "data", "relato-picker-store.json");
}

const globalStore = globalThis as typeof globalThis & {
  __relatoStore?: RelatoStore;
  __relatoStoreChain?: Promise<unknown>;
};

async function loadFromDisk(): Promise<RelatoStore> {
  try {
    const raw = await readFile(storePath(), "utf8");
    const parsed = JSON.parse(raw) as RelatoStore;
    return {
      invites: Array.isArray(parsed.invites) ? parsed.invites : [],
      tray: Array.isArray(parsed.tray) ? parsed.tray : [],
    };
  } catch {
    return { invites: [], tray: [] };
  }
}

async function persist(store: RelatoStore) {
  const file = storePath();
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(store, null, 2), "utf8");
  globalStore.__relatoStore = store;
}

function queue<T>(job: () => Promise<T>): Promise<T> {
  const previous = globalStore.__relatoStoreChain ?? Promise.resolve();
  const next = previous.then(job, job);
  globalStore.__relatoStoreChain = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

export async function readStore(): Promise<RelatoStore> {
  return queue(async () => {
    if (!globalStore.__relatoStore) {
      globalStore.__relatoStore = await loadFromDisk();
    }
    return globalStore.__relatoStore ?? EMPTY;
  });
}

export async function updateStore(
  updater: (current: RelatoStore) => RelatoStore | Promise<RelatoStore>,
) {
  return queue(async () => {
    const current = globalStore.__relatoStore ?? (await loadFromDisk());
    const next = await updater(current);
    await persist(next);
    return next;
  });
}
