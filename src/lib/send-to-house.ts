import {
  RELATO_BANDEJA_URL,
  RELATO_MASCOTAS_BANDEJA_URL,
} from "@/lib/config";

export function houseBandejaUrl(
  from: "relato" | "mascotas",
  returnUrl?: string,
) {
  if (returnUrl) return returnUrl;
  return from === "mascotas" ? RELATO_MASCOTAS_BANDEJA_URL : RELATO_BANDEJA_URL;
}

/** Relato receives only the opaque handoff id. No token and no photo payload. */
export function withPickerQuery(base: string, pickerId: string) {
  const url = new URL(base);
  url.searchParams.set("picker", pickerId);
  url.hash = "";
  return url.toString();
}
