const FROM_KEY = "relato-fotos-picker-from";
const RETURN_KEY = "relato-fotos-picker-return";

export type HouseFrom = "relato" | "mascotas";

export function houseLabel(from: HouseFrom) {
  return from === "mascotas" ? "Relato Mascotas" : "Relato";
}

export function inferHouseFromReturn(returnUrl?: string): HouseFrom | undefined {
  if (!returnUrl) return undefined;
  try {
    const host = new URL(returnUrl).hostname.toLowerCase();
    if (host.includes("mascotas")) return "mascotas";
    if (host.includes("relato")) return "relato";
  } catch {
    /* ignore */
  }
  return undefined;
}

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

export function resolveHouse(
  from?: HouseFrom,
  returnUrl?: string,
): HouseFrom {
  if (from) return from;
  const remembered = readRememberedHouse();
  if (remembered.from) return remembered.from;
  return (
    inferHouseFromReturn(returnUrl || remembered.returnUrl) ?? "relato"
  );
}

export function safeReturnUrl(raw?: string) {
  if (!raw) return undefined;
  try {
    const url = new URL(raw);
    const host = url.hostname;
    const allowed =
      host === "localhost" ||
      host === "127.0.0.1" ||
      (host.endsWith(".vercel.app") && host.includes("relato"));
    if (
      !allowed ||
      (url.protocol !== "https:" && host !== "localhost" && host !== "127.0.0.1")
    ) {
      return undefined;
    }
    return url.toString();
  } catch {
    return undefined;
  }
}
