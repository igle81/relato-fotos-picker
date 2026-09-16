import type { PickedPhoto } from "@/lib/types";

const DEMOS: Array<Omit<PickedPhoto, "source" | "thumbnailUrl">> = [
  {
    id: "demo-mesa",
    filename: "mesa-domingo.jpg",
    mimeType: "image/svg+xml",
    type: "PHOTO",
    width: 1200,
    height: 900,
    createdAt: "2026-09-07T11:20:00Z",
  },
  {
    id: "demo-mar",
    filename: "paseo-al-mar.jpg",
    mimeType: "image/svg+xml",
    type: "PHOTO",
    width: 1200,
    height: 900,
    createdAt: "2026-09-03T18:05:00Z",
  },
  {
    id: "demo-ventana",
    filename: "luz-de-tarde.jpg",
    mimeType: "image/svg+xml",
    type: "PHOTO",
    width: 1200,
    height: 900,
    createdAt: "2026-08-28T16:40:00Z",
  },
  {
    id: "demo-cocina",
    filename: "delantal-en-la-cocina.jpg",
    mimeType: "image/svg+xml",
    type: "PHOTO",
    width: 1200,
    height: 900,
    createdAt: "2026-08-22T09:12:00Z",
  },
  {
    id: "demo-camino",
    filename: "camino-de-casa.jpg",
    mimeType: "image/svg+xml",
    type: "PHOTO",
    width: 1200,
    height: 900,
    createdAt: "2026-08-19T19:48:00Z",
  },
  {
    id: "demo-libro",
    filename: "libro-abierto.jpg",
    mimeType: "image/svg+xml",
    type: "PHOTO",
    width: 1200,
    height: 900,
    createdAt: "2026-08-17T21:02:00Z",
  },
];

export function demoCatalog(): PickedPhoto[] {
  return DEMOS.map((item) => ({
    ...item,
    source: "demo",
    thumbnailUrl: `/demo/${item.id}.svg`,
  }));
}
