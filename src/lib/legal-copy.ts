import { HANDOFF_TTL_MS } from "@/lib/config";

export const GOOGLE_CONSENT = {
  title: "Antes de conectar con Google",
  paragraphs: [
    "Relato solo lee las fotos que tú eliges. El acceso es de solo lectura: no modificamos ni borramos nada en Google Fotos.",
    "No vendemos tus datos, no los usamos para entrenar inteligencias artificiales públicas y no mostramos anuncios.",
    "Este uso cumple la política de Datos de Usuario de los Servicios API de Google, incluidos los requisitos de Uso Limitado.",
  ],
  privacyHref: "/privacidad",
  privacyLabel: "política de privacidad",
  accept: "Acepto y continúo con Google",
  decline: "Ahora no",
} as const;

export function handoffMinutes() {
  return Math.round(HANDOFF_TTL_MS / 60_000);
}

export function tokenHandlingCopy() {
  const minutes = handoffMinutes();
  return `El permiso de Google se usa en el servidor del selector solo para descargar las fotos que tú eliges. El token no se guarda y no viaja en la dirección web. A Relato solo se le pasa un identificador opaco, de un solo uso, que caduca a los ${minutes} minutos. Al recoger las fotos, ese identificador se borra.`;
}
