import {
  RELATO_BANDEJA_URL,
  RELATO_MASCOTAS_BANDEJA_URL,
} from "@/lib/config";
import { compactHandoff, encodeLote } from "@/lib/lote";
import type { PickedPhoto } from "@/lib/types";

export function houseBandejaUrl(
  from: "relato" | "mascotas",
  returnUrl?: string,
) {
  if (returnUrl) return returnUrl;
  return from === "mascotas" ? RELATO_MASCOTAS_BANDEJA_URL : RELATO_BANDEJA_URL;
}

export function withPickerQuery(
  base: string,
  input: {
    id: string;
    from: "relato" | "mascotas";
    googleToken: string | null;
    photos: PickedPhoto[];
  },
) {
  const url = new URL(base);
  url.searchParams.set("picker", input.id);
  const lote = encodeLote(compactHandoff(input));
  url.hash = `lote=${lote}`;
  return url.toString();
}
