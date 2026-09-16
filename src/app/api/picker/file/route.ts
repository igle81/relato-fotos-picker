import { NextResponse } from "next/server";
import { corsPreflight, withCors } from "@/lib/cors";
import { fetchGoogleMedia, mediaFileUrl } from "@/lib/google-picker";
import { bearerToken, fail, missingToken } from "@/lib/http";

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function POST(request: Request) {
  const token = bearerToken(request);
  if (!token) return withCors(request, missingToken());

  let payload: { baseUrl?: string; variant?: "thumb" | "download" };
  try {
    payload = (await request.json()) as {
      baseUrl?: string;
      variant?: "thumb" | "download";
    };
  } catch {
    return withCors(request, fail("Cuerpo JSON no válido."));
  }

  const baseUrl = payload.baseUrl?.trim();
  if (!baseUrl || !baseUrl.startsWith("https://")) {
    return withCors(request, fail("Falta la URL del archivo de Google Fotos."));
  }

  try {
    const { bytes, contentType } = await fetchGoogleMedia(
      token,
      mediaFileUrl(baseUrl, payload.variant === "download" ? "download" : "thumb"),
    );
    return withCors(
      request,
      new NextResponse(Buffer.from(bytes), {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "private, max-age=60",
        },
      }),
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No pude descargar la foto.";
    return withCors(request, fail(message, 502));
  }
}
