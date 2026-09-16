import { NextResponse } from "next/server";
import { getPickingSession } from "@/lib/google-picker";
import { bearerToken, fail, missingToken } from "@/lib/http";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const token = bearerToken(request);
  if (!token) return missingToken();
  const { id } = await context.params;
  if (!id) return fail("Falta el id de la sesión.");

  try {
    const session = await getPickingSession(token, id);
    return NextResponse.json(session);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No pude leer la sesión del Picker.";
    return fail(message, 502);
  }
}
