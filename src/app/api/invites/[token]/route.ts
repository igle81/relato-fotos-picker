import { NextResponse } from "next/server";
import { fail } from "@/lib/http";
import { updateStore } from "@/lib/store";

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  if (!token) return fail("Falta el enlace de invitación.");

  const store = await updateStore((current) => {
    const invite = current.invites.find((item) => item.token === token);
    if (!invite || invite.openedAt) return current;
    return {
      ...current,
      invites: current.invites.map((item) =>
        item.token === token
          ? { ...item, openedAt: new Date().toISOString() }
          : item,
      ),
    };
  });

  const invite = store.invites.find((item) => item.token === token);
  if (!invite) return fail("Ese enlace no existe o ya no vale.", 404);
  if (new Date(invite.expiresAt).getTime() < Date.now()) {
    return fail("Este enlace ha caducado. Pide otro correo a Relato.", 410);
  }

  return NextResponse.json({
    email: invite.email,
    name: invite.name,
    expiresAt: invite.expiresAt,
    completedAt: invite.completedAt ?? null,
  });
}
