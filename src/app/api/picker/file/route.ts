import { NextResponse } from "next/server";
import { fetchGoogleMedia, mediaFileUrl } from "@/lib/google-picker";
import { bearerToken, fail, missingToken } from "@/lib/http";

export async function POST(request: Request) {
  const token = bearerToken(request);
  if (!token) return missingToken();

  let payload: { baseUrl?: string; variant?: "thumb" | "download" };
  try {
    payload = (await request.json()) as {
      baseUrl?: string;
      variant?: "thumb" | "download";
    };
  } catch {
    return fail("Cuerpo JSON no válido.");
  }

  const baseUrl = payload.baseUrl?.trim();
  if (!baseUrl || !baseUrl.startsWith("https://")) {
    return fail("Falta la URL del archivo de Google Fotos.");
  }

  try {
    const { bytes, contentType } = await fetchGoogleMedia(
      token,
      mediaFileUrl(baseUrl, payload.variant === "download" ? "download" : "thumb"),
    );
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No pude descargar la foto.";
    return fail(message, 502);
  }
}
