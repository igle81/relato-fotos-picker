"use client";

import { useState, type FormEvent } from "react";
import { AlertCircle, Check, Copy, Mail, MailOpen } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiCreateInvite } from "@/lib/client-api";

export function InviteForm() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState<{
    link: string;
    subject: string;
    text: string;
    gmailUrl: string;
    mailtoUrl: string;
    sent: boolean;
    email: string;
  } | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const created = await apiCreateInvite(email, name);
      setResult({
        link: created.link,
        subject: created.subject,
        text: created.text,
        gmailUrl: created.gmailUrl,
        mailtoUrl: created.mailtoUrl,
        sent: created.sent,
        email: created.invite.email,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No pude crear el correo.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    if (!result) return;
    await navigator.clipboard.writeText(result.link);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h1 className="font-heading text-3xl tracking-tight sm:text-4xl">
          Mandar el correo de este mes
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Relato envía un enlace único. La familia elige hasta 10 fotos. Esas
          fotos quedan pendientes en la bandeja. No se publican solas.
        </p>
      </section>

      {error ? (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>No se pudo preparar el correo</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Destinatario</CardTitle>
          <CardDescription>
            Nunca pidas la contraseña. El correo solo abre el Picker de Google
            Fotos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="invite-email">Correo</Label>
              <Input
                id="invite-email"
                type="email"
                required
                autoComplete="email"
                placeholder="familia@correo.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="invite-name">Nombre (opcional)</Label>
              <Input
                id="invite-name"
                name="recipient-name"
                autoComplete="off"
                placeholder="Luis Javier"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <Button type="submit" size="lg" disabled={busy}>
              <Mail />
              {busy ? "Preparando…" : "Crear correo e enlace"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result ? (
        <Card>
          <CardHeader>
            <CardTitle>
              {result.sent
                ? `Correo enviado a ${result.email}`
                : `Enlace listo para ${result.email}`}
            </CardTitle>
            <CardDescription>
              {result.sent
                ? "Si no llega, abre Gmail y reenvía el mismo texto."
                : "Sin Resend en el servidor: ábrelo en Gmail o cópialo. El enlace ya guarda la invitación."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="break-all rounded-lg bg-muted px-3 py-2 text-sm">
              {result.link}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => void copyLink()}>
                {copied ? <Check /> : <Copy />}
                {copied ? "Copiado" : "Copiar enlace"}
              </Button>
              <Button variant="secondary" asChild>
                <a href={result.gmailUrl} target="_blank" rel="noreferrer">
                  <MailOpen />
                  Abrir en Gmail
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href={result.mailtoUrl}>Correo del sistema</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
