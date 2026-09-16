import { NextResponse } from "next/server";

export function allowedPickerOrigin(origin: string | null) {
  if (!origin) return null;
  try {
    const url = new URL(origin);
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
      return origin;
    }
    if (
      url.protocol === "https:" &&
      url.hostname.endsWith(".vercel.app") &&
      url.hostname.includes("relato")
    ) {
      return origin;
    }
  } catch {
    return null;
  }
  return null;
}

export function corsHeaders(request: Request) {
  const origin = allowedPickerOrigin(request.headers.get("origin"));
  if (!origin) return {} as Record<string, string>;
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export function withCors(request: Request, response: NextResponse) {
  const headers = corsHeaders(request);
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
  return response;
}

export function corsPreflight(request: Request) {
  return withCors(request, new NextResponse(null, { status: 204 }));
}
