import { NextResponse } from "next/server";
import { MAX_CANDIDATES } from "@/lib/config";
import { createPickingSession } from "@/lib/google-picker";
import { bearerToken, fail, missingToken } from "@/lib/http";

export async function POST(request: Request) {
  const token = bearerToken(request);
  if (!token) return missingToken();

  try {
    const session = await createPickingSession(token, MAX_CANDIDATES);
    return NextResponse.json(session);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No pude abrir el Picker de Google Fotos.";
    return fail(message, 502);
  }
}
