import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, describe, it } from "node:test";
import { GOOGLE_CONSENT, tokenHandlingCopy } from "@/lib/legal-copy";
import {
  resetHandoffMemory,
  saveHandoff,
  takeHandoff,
  toPublicHandoff,
} from "@/lib/handoff-store";
import { prepareHandoffPhotos } from "@/lib/prepare-handoff";
import { rankedSelectionNotice } from "@/lib/selection-notice";
import { withPickerQuery } from "@/lib/send-to-house";
import type { PhotoHandoff, PickedPhoto } from "@/lib/types";

const TOKEN = "ya29.super-secret-google-token";

function googlePhoto(): PickedPhoto {
  return {
    id: "media-1",
    filename: "cumple.jpg",
    mimeType: "image/jpeg",
    type: "PHOTO",
    createdAt: "2024-01-02T00:00:00Z",
    thumbnailUrl: "https://photos.example/base",
    googleBaseUrl: "https://photos.example/base",
    source: "google_photos",
  };
}

describe("handoff opaco", { concurrency: 1 }, () => {
  let dir = "";

  before(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "relato-handoff-"));
    process.env.RELATO_HANDOFF_PATH = path.join(dir, "handoff.json");
    resetHandoffMemory();
  });

  after(async () => {
    delete process.env.RELATO_HANDOFF_PATH;
    resetHandoffMemory();
    if (dir) await rm(dir, { recursive: true, force: true });
  });

  it("descarga con el token y no lo deja en las fotos", async () => {
    let seen = "";
    const photos = await prepareHandoffPhotos([googlePhoto()], TOKEN, async (token, url) => {
      seen = `${token} ${url}`;
      return {
        bytes: Uint8Array.from([1, 2, 3]).buffer,
        contentType: "image/jpeg",
      };
    });
    assert.match(seen, new RegExp(TOKEN));
    assert.match(seen, /=w2048-h2048/);
    const serialized = JSON.stringify(photos);
    assert.equal(serialized.includes(TOKEN), false);
    assert.equal(serialized.includes("photos.example"), false);
    assert.equal(photos[0]?.previewDataUrl?.startsWith("data:image/jpeg;base64,"), true);
    assert.equal("googleBaseUrl" in (photos[0] ?? {}), false);
  });

  it("no guarda el token y el identificador solo se puede leer una vez", async () => {
    resetHandoffMemory();
    const photos = await prepareHandoffPhotos([googlePhoto()], TOKEN, async () => ({
      bytes: Uint8Array.from([9]).buffer,
      contentType: "image/jpeg",
    }));
    const dirty = {
      id: "lote-1",
      from: "relato" as const,
      googleToken: TOKEN,
      photos: photos.map((photo) => ({
        ...photo,
        googleBaseUrl: `https://photos.example/base?access_token=${TOKEN}`,
      })),
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    };
    const saved = await saveHandoff(dirty as unknown as PhotoHandoff);
    assert.ok(saved);
    const file = await readFile(process.env.RELATO_HANDOFF_PATH!, "utf8");
    assert.equal(file.includes(TOKEN), false);
    assert.equal(file.includes("googleToken"), false);
    assert.equal(file.includes("photos.example"), false);

    const first = await takeHandoff("lote-1");
    assert.ok(first);
    const pub = JSON.stringify(toPublicHandoff(first));
    assert.equal(pub.includes(TOKEN), false);
    assert.equal(pub.includes("googleToken"), false);
    assert.match(pub, /data:image\/jpeg;base64,/);
    assert.equal(await takeHandoff("lote-1"), null);
  });

  it("borra un lote caducado y no lo entrega", async () => {
    resetHandoffMemory();
    const expired: PhotoHandoff = {
      id: "viejo",
      from: "mascotas",
      photos: [
        {
          id: "p",
          filename: "a.jpg",
          mimeType: "image/jpeg",
          type: "PHOTO",
          thumbnailUrl: "data:image/jpeg;base64,QQ==",
          source: "google_photos",
          previewDataUrl: "data:image/jpeg;base64,QQ==",
        },
      ],
      createdAt: new Date(Date.now() - 60_000).toISOString(),
      expiresAt: new Date(Date.now() - 1_000).toISOString(),
    };
    await writeFile(
      process.env.RELATO_HANDOFF_PATH!,
      JSON.stringify({
        items: [{ ...expired, googleToken: TOKEN }],
      }),
      "utf8",
    );
    resetHandoffMemory();
    assert.equal(await takeHandoff("viejo"), null);
    const file = await readFile(process.env.RELATO_HANDOFF_PATH!, "utf8");
    assert.equal(file.includes(TOKEN), false);
    assert.equal(file.includes("QQ=="), false);
  });

  it("la url hacia Relato solo lleva el identificador opaco", () => {
    const url = withPickerQuery(
      `https://relato.example/app/bandeja?from=relato#lote=${TOKEN}`,
      "id-opaco",
    );
    const parsed = new URL(url);
    assert.equal(parsed.searchParams.get("picker"), "id-opaco");
    assert.equal(parsed.hash, "");
    assert.equal(url.includes(TOKEN), false);
    assert.equal(url.includes("lote="), false);
    assert.equal(parsed.searchParams.get("from"), "relato");
  });

  it("prepara una foto demo sin token", async () => {
    const photos = await prepareHandoffPhotos(
      [
        {
          id: "demo-mesa",
          filename: "mesa-domingo.jpg",
          mimeType: "image/svg+xml",
          type: "PHOTO",
          thumbnailUrl: "/demo/demo-mesa.svg",
          source: "demo",
        },
      ],
      null,
    );
    assert.match(photos[0]?.previewDataUrl ?? "", /^data:image\/svg\+xml;base64,/);
    assert.equal(JSON.stringify(photos).includes("google"), false);
  });
});

describe("textos", () => {
  it("describe el orden por fecha y no dice que una IA ordenó", () => {
    const notice = rankedSelectionNotice(3);
    assert.match(notice, /por fecha/);
    assert.match(notice, /más reciente a la más antigua/);
    assert.match(notice, /Entraron 3 fotos/);
    assert.equal(/la ia ordenó/i.test(notice), false);
    assert.match(rankedSelectionNotice(1), /Entró 1 foto/);
  });

  it("el aviso previo cubre lectura, venta, IA, anuncios y Uso Limitado", () => {
    const text = GOOGLE_CONSENT.paragraphs.join(" ");
    assert.match(text, /solo lee las fotos que tú eliges/);
    assert.match(text, /solo lectura/);
    assert.match(text, /No vendemos tus datos/);
    assert.match(text, /inteligencias artificiales públicas/);
    assert.match(text, /no mostramos anuncios/);
    assert.match(text, /política de Datos de Usuario de los Servicios API de Google/);
    assert.match(text, /Uso Limitado/);
    assert.equal(GOOGLE_CONSENT.privacyHref, "/privacidad");
    assert.match(GOOGLE_CONSENT.accept, /Acepto/);
    assert.match(tokenHandlingCopy(), /identificador opaco/);
    assert.match(tokenHandlingCopy(), /10 minutos/);
    assert.match(tokenHandlingCopy(), /no se guarda/);
  });
});
