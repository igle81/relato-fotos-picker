import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import {
  DEFAULT_HOUSEHOLD_ID,
  INVITE_TTL_DAYS,
  publicAppUrl,
} from "@/lib/config";
import {
  gmailComposeUrl,
  invitePlainBody,
  inviteSubject,
  mailtoUrl,
  sendInviteEmail,
} from "@/lib/email";
import { fail } from "@/lib/http";
import { updateStore } from "@/lib/store";
import type { Invite } from "@/lib/types";

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  let payload: { email?: string; name?: string };
  try {
    payload = (await request.json()) as { email?: string; name?: string };
  } catch {
    return fail("Cuerpo JSON no válido.");
  }

  const email = payload.email?.trim().toLowerCase() ?? "";
  const name = payload.name?.trim() ?? "";
  if (!validEmail(email)) {
    return fail("Pon un correo válido. Relato no pide la contraseña.");
  }

  const now = Date.now();
  const invite: Invite = {
    token: randomBytes(18).toString("base64url"),
    email,
    name,
    householdId: DEFAULT_HOUSEHOLD_ID,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString(),
  };

  await updateStore((store) => ({
    ...store,
    invites: [invite, ...store.invites],
  }));

  const origin = publicAppUrl(request);
  const link = `${origin}/i/${invite.token}`;
  const subject = inviteSubject();
  const text = invitePlainBody(invite, link);

  let sent = false;
  let provider: "resend" | "link" = "link";
  try {
    const result = await sendInviteEmail(invite, link);
    sent = result.sent;
    provider = result.provider;
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No pude enviar el correo. Copia el enlace.",
        invite,
        link,
        subject,
        text,
        gmailUrl: gmailComposeUrl(email, subject, text),
        mailtoUrl: mailtoUrl(email, subject, text),
        sent: false,
        provider,
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    invite,
    link,
    subject,
    text,
    gmailUrl: gmailComposeUrl(email, subject, text),
    mailtoUrl: mailtoUrl(email, subject, text),
    sent,
    provider,
  });
}
