import { NextResponse } from "next/server";
import { corsPreflight, withCors } from "@/lib/cors";
import { consumeHandoff, readHandoff } from "@/lib/handoff-store";
import { fail } from "@/lib/http";

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const item = await readHandoff(id);
  if (!item) {
    return withCors(
      request,
      fail("Ese lote de fotos ya no está. Vuelve a elegirlas en el Picker.", 404),
    );
  }
  return withCors(
    request,
    NextResponse.json({
      id: item.id,
      from: item.from,
      googleToken: item.googleToken,
      photos: item.photos,
      expiresAt: item.expiresAt,
    }),
  );
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  await consumeHandoff(id);
  return withCors(request, NextResponse.json({ ok: true }));
}
