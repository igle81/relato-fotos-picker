import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, describe, it } from "node:test";
import { DELETE, GET } from "@/app/api/handoff/[id]/route";
import { POST } from "@/app/api/handoff/route";
import { resetHandoffMemory } from "@/lib/handoff-store";
import type { PickedPhoto } from "@/lib/types";

const TOKEN = "ya29.route-secret-token";

describe("POST/GET handoff", { concurrency: 1 }, () => {
  let dir = "";
  const originalFetch = globalThis.fetch;

  before(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "relato-route-"));
    process.env.RELATO_HANDOFF_PATH = path.join(dir, "handoff.json");
    resetHandoffMemory();
    globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      const auth = new Headers(init?.headers).get("authorization") ?? "";
      assert.equal(auth, `Bearer ${TOKEN}`);
      return new Response(Uint8Array.from([7, 7, 7]), {
        status: 200,
        headers: { "content-type": "image/jpeg" },
      });
    }) as typeof fetch;
  });

  after(async () => {
    globalThis.fetch = originalFetch;
    delete process.env.RELATO_HANDOFF_PATH;
    resetHandoffMemory();
    if (dir) await rm(dir, { recursive: true, force: true });
  });

  it("entrega las fotos una sola vez y no devuelve el token", async () => {
    const photo: PickedPhoto = {
      id: "g1",
      filename: "playa.jpg",
      mimeType: "image/jpeg",
      type: "PHOTO",
      createdAt: "2025-05-01T12:00:00Z",
      thumbnailUrl: "https://lh3.googleusercontent.com/abc",
      googleBaseUrl: "https://lh3.googleusercontent.com/abc",
      source: "google_photos",
    };
    const created = await POST(
      new Request("http://127.0.0.1/api/handoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from: "relato", googleToken: TOKEN, photos: [photo] }),
      }),
    );
    assert.equal(created.status, 200);
    const body = (await created.json()) as { id: string; count: number };
    assert.equal(body.count, 1);
    const stored = await readFile(process.env.RELATO_HANDOFF_PATH!, "utf8");
    assert.equal(stored.includes(TOKEN), false);
    assert.equal(stored.includes("googleToken"), false);
    assert.equal(stored.includes("googleusercontent"), false);
    assert.match(stored, /data:image\/jpeg;base64,/);

    const params = Promise.resolve({ id: body.id });
    const first = await GET(new Request("http://127.0.0.1/api/handoff/" + body.id), {
      params,
    });
    assert.equal(first.status, 200);
    const lote = (await first.json()) as {
      googleToken?: string;
      photos: Array<{ previewDataUrl?: string; googleBaseUrl?: string }>;
    };
    assert.equal(lote.googleToken, undefined);
    assert.equal(lote.photos[0]?.googleBaseUrl, undefined);
    assert.match(lote.photos[0]?.previewDataUrl ?? "", /^data:image\/jpeg;base64,/);
    assert.equal(JSON.stringify(lote).includes(TOKEN), false);

    const second = await GET(new Request("http://127.0.0.1/api/handoff/" + body.id), {
      params: Promise.resolve({ id: body.id }),
    });
    assert.equal(second.status, 404);

    const removed = await DELETE(new Request("http://127.0.0.1/api/handoff/" + body.id), {
      params: Promise.resolve({ id: body.id }),
    });
    assert.equal(removed.status, 200);
  });
});
