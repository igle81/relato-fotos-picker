const TOKEN_KEY = "relato-fotos-picker-google-token";

export function saveGoogleToken(token: string) {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function readGoogleToken() {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(TOKEN_KEY);
}

export function clearGoogleToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}
