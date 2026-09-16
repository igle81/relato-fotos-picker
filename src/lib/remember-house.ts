const FROM_KEY = "relato-fotos-picker-from";
const RETURN_KEY = "relato-fotos-picker-return";

export type HouseFrom = "relato" | "mascotas";

export function rememberHouse(from?: HouseFrom, returnUrl?: string) {
  if (typeof window === "undefined") return;
  if (from) sessionStorage.setItem(FROM_KEY, from);
  if (returnUrl) sessionStorage.setItem(RETURN_KEY, returnUrl);
}

export function readRememberedHouse(): {
  from?: HouseFrom;
  returnUrl?: string;
} {
  if (typeof window === "undefined") return {};
  const from = sessionStorage.getItem(FROM_KEY);
  const returnUrl = sessionStorage.getItem(RETURN_KEY) || undefined;
  return {
    from: from === "mascotas" || from === "relato" ? from : undefined,
    returnUrl,
  };
}
