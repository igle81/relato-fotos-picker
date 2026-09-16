import { NextResponse } from "next/server";
import { MAX_CANDIDATES } from "@/lib/config";
import { listPickedItems } from "@/lib/google-picker";
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
    const items = await listPickedItems(token, id, MAX_CANDIDATES);
    return NextResponse.json({ items });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No pude listar las fotos elegidas.";
    return fail(message, 502);
  }
}
