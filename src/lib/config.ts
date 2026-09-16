export const MAX_CANDIDATES = 10;

export const PHOTOS_PICKER_SCOPE =
  "https://www.googleapis.com/auth/photospicker.mediaitems.readonly";

export const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() ||
  "377515301721-c6ut1tb6qkc5mr4r9n3b6t0h98o3r4uo.apps.googleusercontent.com";

export const DEFAULT_HOUSEHOLD_ID =
  process.env.RELATO_HOUSEHOLD_ID?.trim() ||
  "2895f664-3dda-49d4-ba97-0b2869314f9d";

export const INVITE_TTL_DAYS = 14;

export const RELATO_BANDEJA_URL =
  process.env.NEXT_PUBLIC_RELATO_BANDEJA_URL?.replace(/\/$/, "") ||
  "https://relato-five-kohl.vercel.app/app/bandeja";

export const RELATO_MASCOTAS_BANDEJA_URL =
  process.env.NEXT_PUBLIC_RELATO_MASCOTAS_BANDEJA_URL?.replace(/\/$/, "") ||
  "https://relato-mascotas.vercel.app/app/bandeja";

export const HANDOFF_TTL_MS = 20 * 60 * 1000;

export function hasGoogleClientId() {
  return GOOGLE_CLIENT_ID.length > 0;
}

export function publicAppUrl(request?: Request) {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (request) {
    const host =
      request.headers.get("x-forwarded-host") || request.headers.get("host");
    const proto = request.headers.get("x-forwarded-proto") || "https";
    if (host) return `${proto}://${host}`;
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://127.0.0.1:43147";
}
