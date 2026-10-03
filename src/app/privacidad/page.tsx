import type { Metadata } from "next";
import Link from "next/link";
import { GOOGLE_CONSENT, tokenHandlingCopy } from "@/lib/legal-copy";

export const metadata: Metadata = {
  title: "Política de privacidad · Relato Picker",
  description:
    "Qué fotos lee el selector de Relato y cómo se usa el permiso de Google.",
};

export default function PrivacidadPage() {
  return (
    <article className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-heading text-3xl tracking-tight">
        Política de privacidad
      </h1>
      <p className="text-sm text-muted-foreground">
        Esta página describe el selector de fotos. No incluye razón social,
        NIF ni dirección: esos datos no forman parte de este programa.
      </p>
      {GOOGLE_CONSENT.paragraphs.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
      <p>{tokenHandlingCopy()}</p>
      <p>
        El alcance que se pide a Google es solo lectura:{" "}
        <code>photospicker.mediaitems.readonly</code>. El Picker oficial es
        quien muestra el rollo. Relato no pide la contraseña.
      </p>
      <p>
        El texto oficial de Google está en la{" "}
        <a
          className="underline"
          href="https://developers.google.com/terms/api-services-user-data-policy"
          target="_blank"
          rel="noreferrer"
        >
          política de Datos de Usuario de los Servicios API de Google
        </a>
        .
      </p>
      <p>
        <Link href="/terminos" className="underline">
          Términos
        </Link>
      </p>
    </article>
  );
}
