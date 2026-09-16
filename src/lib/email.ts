import type { Invite } from "@/lib/types";

export function inviteSubject() {
  return "Relato · elige hasta 10 fotos de este mes";
}

export function invitePlainBody(invite: Invite, link: string) {
  const hello = invite.name ? `Hola ${invite.name}` : "Hola";
  return `${hello},

Este mes Relato necesita que elijas las fotos. Google no nos deja mirar el rollo de Google Fotos a solas: tienes que marcarlas tú.

1. Abre este enlace: ${link}
2. Entra con tu Gmail (Relato no te pide la contraseña).
3. Elige hasta 10 fotos del mes y confirma.

Van a la bandeja de Relato como pendientes. No se publican hasta que autor y acompañante den el sí.

El enlace caduca en 14 días.`;
}

export function inviteHtmlBody(invite: Invite, link: string) {
  const hello = invite.name ? `Hola ${invite.name}` : "Hola";
  return `<!doctype html>
<html lang="es">
  <body style="margin:0;background:#f6efe3;color:#4a3424;font-family:Georgia,serif;">
    <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
      <p style="letter-spacing:.08em;text-transform:uppercase;font-size:12px;color:#8c5a3c;">Relato</p>
      <h1 style="font-weight:normal;font-size:28px;line-height:1.25;">${hello}, toca elegir las fotos de este mes.</h1>
      <p style="font-size:16px;line-height:1.5;">Google no deja que Relato recorra el rollo a solas. Tú eliges hasta 10. Entran en la bandeja como pendientes. No se publican hasta el dual sí.</p>
      <p style="margin:28px 0;">
        <a href="${link}" style="display:inline-block;background:#5c3a24;color:#f7f1e4;text-decoration:none;padding:12px 18px;border-radius:999px;">Elegir fotos</a>
      </p>
      <p style="font-size:14px;color:#6b5340;">Relato no te pide la contraseña. El enlace caduca en 14 días.</p>
    </div>
  </body>
</html>`;
}

export function gmailComposeUrl(email: string, subject: string, body: string) {
  const params = new URLSearchParams({
    view: "cm",
    fs: "1",
    to: email,
    su: subject,
    body,
  });
  return `https://mail.google.com/mail/?${params.toString()}`;
}

export function mailtoUrl(email: string, subject: string, body: string) {
  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export async function sendInviteEmail(invite: Invite, link: string) {
  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM?.trim() || "Relato <relato@resend.dev>";
  if (!key) {
    return { sent: false as const, provider: "link" as const };
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [invite.email],
      subject: inviteSubject(),
      html: inviteHtmlBody(invite, link),
      text: invitePlainBody(invite, link),
    }),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text.slice(0, 280) || "Resend no pudo enviar el correo.");
  }
  return { sent: true as const, provider: "resend" as const };
}
