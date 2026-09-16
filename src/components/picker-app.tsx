"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Check,
  Images,
  LoaderCircle,
  Sparkles,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PhotoThumb } from "@/components/photo-thumb";
import { GOOGLE_CLIENT_ID, MAX_CANDIDATES } from "@/lib/config";
import {
  apiCreateSession,
  apiDeliverInvitePhotos,
  apiListItems,
  apiPollSession,
} from "@/lib/client-api";
import { demoCatalog } from "@/lib/demo-photos";
import { requestPhotosPickerToken } from "@/lib/google-auth";
import { pickerOpenUrl } from "@/lib/google-picker";
import { saveGoogleToken } from "@/lib/google-token";
import {
  addCandidatesToTray,
  pendingCount,
  rankPickedPhotos,
  readTray,
} from "@/lib/tray";
import type { PickedPhoto } from "@/lib/types";

function notifyTray() {
  window.dispatchEvent(new Event("relato-tray-changed"));
}

async function waitForPickedSession(token: string, sessionId: string) {
  const started = Date.now();
  let delay = 2000;
  while (Date.now() - started < 5 * 60 * 1000) {
    const session = await apiPollSession(token, sessionId);
    if (session.mediaItemsSet) return session;
    delay = session.pollIntervalMs || delay;
    await new Promise((resolve) => window.setTimeout(resolve, delay));
  }
  throw new Error("Se agotó el tiempo de espera del Picker.");
}

export function PickerApp({
  inviteToken,
  inviteName,
}: {
  inviteToken?: string;
  inviteName?: string;
}) {
  const router = useRouter();
  const googleReady = GOOGLE_CLIENT_ID.length > 0;
  const demos = useMemo(() => demoCatalog(), []);
  const [selectedDemo, setSelectedDemo] = useState<string[]>(
    demos.slice(0, 3).map((item) => item.id),
  );
  const [busy, setBusy] = useState<"google" | "demo" | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [picked, setPicked] = useState<PickedPhoto[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  function toggleDemo(id: string) {
    setSelectedDemo((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : current.length >= MAX_CANDIDATES
          ? current
          : [...current, id],
    );
  }

  async function sendToTray(photos: PickedPhoto[], ranked: boolean) {
    const room = Math.max(0, MAX_CANDIDATES - pendingCount(readTray()));
    const chosen = ranked
      ? rankPickedPhotos(photos, room)
      : photos.slice(0, room);

    try {
      if (inviteToken) {
        const rankedPhotos = rankPickedPhotos(photos, MAX_CANDIDATES);
        const delivered = await apiDeliverInvitePhotos(
          inviteToken,
          rankedPhotos,
          token,
        );
        addCandidatesToTray(rankedPhotos);
        notifyTray();
        setNotice(delivered.notice);
        router.push("/bandeja");
        return;
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No pude dejar las fotos en la bandeja de Relato.",
      );
      return;
    }

    const result = addCandidatesToTray(chosen);
    notifyTray();
    setNotice(
      ranked
        ? `La IA ordenó las ${result.added} más recientes entre las que tú elegiste. No puede mirar el resto del rollo.`
        : `Entraron ${result.added} fotos a la bandeja como pendientes.`,
    );
    if (result.added === 0) {
      setError(
        room === 0
          ? `La bandeja ya tiene ${MAX_CANDIDATES} pendientes. Rechaza alguna antes de añadir más.`
          : "Esas fotos ya estaban en la bandeja.",
      );
      return;
    }
    router.push("/bandeja");
  }

  async function startGooglePicker() {
    setError(null);
    setNotice(null);
    setBusy("google");
    setStatus("Pidiendo permiso a Google…");
    const popup = window.open(
      "about:blank",
      "relato-google-photos-picker",
      "popup=yes,width=480,height=760",
    );
    try {
      const accessToken = await requestPhotosPickerToken();
      saveGoogleToken(accessToken);
      setToken(accessToken);
      setStatus("Abriendo el Picker oficial…");
      const session = await apiCreateSession(accessToken);
      const url = pickerOpenUrl(session.pickerUri);
      if (popup && !popup.closed) {
        popup.location.href = url;
      } else {
        window.open(url, "relato-google-photos-picker");
      }
      setStatus("Elige hasta 10 fotos en la pestaña de Google y vuelve aquí.");
      await waitForPickedSession(accessToken, session.id);
      setStatus("Leyendo las fotos que marcaste…");
      const items = await apiListItems(accessToken, session.id);
      setPicked(items);
      if (items.length === 0) {
        setError("No llegó ninguna foto. Vuelve a abrir el Picker y elige al menos una.");
        return;
      }
      await sendToTray(items, true);
    } catch (err) {
      if (popup && !popup.closed) popup.close();
      setError(err instanceof Error ? err.message : "No pude abrir Google Fotos.");
    } finally {
      setBusy(null);
      setStatus(null);
    }
  }

  function sendDemo() {
    setError(null);
    setBusy("demo");
    const photos = demos.filter((item) => selectedDemo.includes(item.id));
    if (photos.length === 0) {
      setError("Marca al menos una foto de ejemplo.");
      setBusy(null);
      return;
    }
    void sendToTray(photos, true).finally(() => setBusy(null));
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <Badge variant="secondary">
          {inviteToken
            ? "Correo de Relato · elige a mano"
            : "Google ya no deja escanear el rollo"}
        </Badge>
        <h1 className="font-heading max-w-3xl text-3xl leading-tight tracking-tight sm:text-4xl">
          {inviteToken
            ? `${inviteName ? `${inviteName}, ` : ""}elige hasta ${MAX_CANDIDATES} fotos. Van a la bandeja pendientes.`
            : "La IA no puede elegir sola las fotos de Google Fotos cada mes."}
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          {inviteToken
            ? `Relato no pide la contraseña. Abre el Picker, marca hasta ${MAX_CANDIDATES} y confirma. Entran en la bandeja como pendientes: hace falta el dual sí para publicarlas.`
            : `Desde marzo de 2025 Google cerró el acceso al álbum completo. Lo que sí se puede: un correo con enlace, que la familia abra el Picker, elija hasta ${MAX_CANDIDATES} fotos, y que Relato las deje pendientes en la bandeja. Nunca se publican solas.`}
        </p>
      </section>

      {error ? (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>No se pudieron traer las fotos</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {notice ? (
        <Alert>
          <Sparkles />
          <AlertTitle>Candidatas listas</AlertTitle>
          <AlertDescription>{notice}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Picker de Google Fotos</CardTitle>
            <CardDescription>
              Se abre en una pestaña nueva. Relato no pide la contraseña ni
              puede meterse en el rollo a escondidas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {googleReady ? (
              <>
                <Button
                  size="lg"
                  className="w-full sm:w-auto"
                  disabled={busy !== null}
                  onClick={() => void startGooglePicker()}
                >
                  {busy === "google" ? (
                    <LoaderCircle className="animate-spin" />
                  ) : (
                    <Images />
                  )}
                  Elegir fotos de Google Fotos
                </Button>
                {status ? (
                  <p className="text-sm text-muted-foreground">{status}</p>
                ) : null}
              </>
            ) : (
              <Alert>
                <AlertCircle />
                <AlertTitle>Falta el Client ID de Google</AlertTitle>
                <AlertDescription>
                  En Vercel, variable <code>NEXT_PUBLIC_GOOGLE_CLIENT_ID</code>:
                  el ID de cliente OAuth web que termina en{" "}
                  <code>.apps.googleusercontent.com</code>. No hace falta el
                  secret ni la contraseña. En Google Cloud: activa Photos
                  Picker API, origen{" "}
                  <code>https://relato-fotos-picker.vercel.app</code> y el
                  Gmail del cliente como tester.
                </AlertDescription>
              </Alert>
            )}
            {picked.length > 0 ? (
              <p className="text-sm text-muted-foreground">
                Última tanda: {picked.length} foto
                {picked.length === 1 ? "" : "s"} elegidas a mano.
              </p>
            ) : null}
          </CardContent>
        </Card>

        {inviteToken ? (
          <Card>
            <CardHeader>
              <CardTitle>Qué pasa al elegir</CardTitle>
              <CardDescription>
                Relato no publica nada en este paso.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal space-y-2 pl-4 text-sm">
                <li>Abres el Picker o marcas las de ejemplo.</li>
                <li>Elige hasta {MAX_CANDIDATES} fotos y confirma.</li>
                <li>Entran en la bandeja como pendientes.</li>
                <li>Autor y acompañante dan el dual sí más tarde.</li>
              </ol>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Pasos para un cliente nuevo</CardTitle>
              <CardDescription>
                Dile exactamente esto. Nunca le pidas usuario y contraseña.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal space-y-2 pl-4 text-sm">
                <li>Recibe un correo de Relato y abre el enlace.</li>
                <li>Pulsa «Elegir fotos de Google Fotos».</li>
                <li>
                  En la ventana de Google, entra con el Gmail de la familia y
                  acepta solo el Picker.
                </li>
                <li>
                  Si Google dice que la app está en pruebas, ese Gmail tiene
                  que estar en testers.
                </li>
                <li>
                  Elige hasta {MAX_CANDIDATES} fotos. Van a la bandeja como
                  pendientes.
                </li>
                <li>
                  Autor y acompañante dan el sí. Relato no publica nada antes.
                </li>
              </ol>
            </CardContent>
          </Card>
        )}
      </div>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-heading text-2xl">Modo demo</h2>
            <p className="text-sm text-muted-foreground">
              Prueba la bandeja sin conectar Google. La IA solo ordena entre
              las que marques aquí.
            </p>
          </div>
          <Button
            variant="secondary"
            size="lg"
            disabled={busy !== null}
            onClick={sendDemo}
          >
            {busy === "demo" ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <Sparkles />
            )}
            Enviar a la bandeja
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {demos.map((photo) => {
            const on = selectedDemo.includes(photo.id);
            return (
              <button
                key={photo.id}
                type="button"
                onClick={() => toggleDemo(photo.id)}
                className={`group relative overflow-hidden rounded-xl text-left ring-1 transition ${
                  on
                    ? "ring-primary"
                    : "ring-border hover:ring-foreground/30"
                }`}
              >
                <PhotoThumb photo={photo} token={token} />
                <span className="absolute inset-x-0 bottom-0 bg-background/85 px-2 py-1.5 text-xs">
                  {photo.filename.replace(".jpg", "")}
                </span>
                {on ? (
                  <span className="absolute top-2 right-2 rounded-full bg-primary p-1 text-primary-foreground">
                    <Check className="size-3" />
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
