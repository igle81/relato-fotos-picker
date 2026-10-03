import { NextResponse } from "next/server";
import { corsPreflight, withCors } from "@/lib/cors";
import { deleteHandoff, takeHandoff, toPublicHandoff } from "@/lib/handoff-store";
import { fail } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const item = await takeHandoff(id);
  if (!item) {
    return withCors(
      request,
      fail("Ese lote de fotos ya no está. Vuelve a elegirlas en el Picker.", 404),
    );
  }
  return withCors(
    request,
    NextResponse.json(toPublicHandoff(item), {
      headers: { "Cache-Control": "private, no-store" },
    }),
  );
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  await deleteHandoff(id);
  return withCors(request, NextResponse.json({ ok: true }));
}
