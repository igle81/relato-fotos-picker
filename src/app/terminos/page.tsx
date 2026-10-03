import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Términos · Relato Picker",
  description: "Cómo funciona el selector de fotos de Relato.",
};

export default function TerminosPage() {
  return (
    <article className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-heading text-3xl tracking-tight">Términos</h1>
      <p className="text-sm text-muted-foreground">
        Esto explica cómo funciona el selector. No es un contrato con razón
        social, NIF ni fuero: esos datos no constan aquí.
      </p>
      <ul className="list-disc space-y-2 pl-5">
        <li>Eliges hasta 10 fotos a mano, en el Picker de Google o en el modo demo.</li>
        <li>Quedan pendientes. Nada se publica solo.</li>
        <li>En Relato hacen falta el sí del autor y el del acompañante.</li>
        <li>En Relato Mascotas basta el sí del tutor.</li>
        <li>No pedimos la contraseña de Google.</li>
      </ul>
      <p>
        El tratamiento de las fotos está en la{" "}
        <Link href="/privacidad" className="underline">
          política de privacidad
        </Link>
        .
      </p>
    </article>
  );
}
