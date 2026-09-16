"use client";

import Link from "next/link";
import { useLayoutEffect, useMemo, useState } from "react";
import { Inbox, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PhotoThumb } from "@/components/photo-thumb";
import { SendToHouseButtons } from "@/components/send-to-house";
import { Skeleton } from "@/components/ui/skeleton";
import { apiPatchTray, apiReadTray } from "@/lib/client-api";
import { MAX_CANDIDATES } from "@/lib/config";
import { readGoogleToken } from "@/lib/google-token";
import {
  houseLabel,
  readRememberedHouse,
  resolveHouse,
} from "@/lib/remember-house";
import {
  clearRejected,
  readTray,
  rejectTrayItem,
  writeTray,
} from "@/lib/tray";
import type { TrayItem } from "@/lib/types";

function notifyTray() {
  window.dispatchEvent(new Event("relato-tray-changed"));
}

function formatWhen(value?: string) {
  if (!value) return "Fecha desconocida";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Fecha desconocida";
  return new Intl.DateTimeFormat("es", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default function BandejaPage() {
  const [items, setItems] = useState<TrayItem[] | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [house, setHouse] = useState<{
    from: "relato" | "mascotas";
    returnUrl?: string;
  }>({ from: "relato" });

  useLayoutEffect(() => {
    let cancelled = false;
    const local = readTray();
    setItems(local);
    setToken(readGoogleToken());
    const remembered = readRememberedHouse();
    setHouse({
      from: resolveHouse(remembered.from, remembered.returnUrl),
      returnUrl: remembered.returnUrl,
    });

    const load = async () => {
      try {
        const remote = await apiReadTray();
        if (cancelled || remote.length === 0) return;
        if (local.length === 0) {
          writeTray(remote);
          setItems(remote);
          return;
        }
        const ids = new Set(local.map((item) => item.id));
        const extra = remote.filter((item) => !ids.has(item.id));
        if (extra.length === 0) return;
        const merged = [...local, ...extra];
        writeTray(merged);
        setItems(merged);
      } catch {
        /* keep the local bandeja */
      }
    };
    void load();

    const refresh = () => {
      if (!cancelled) {
        setItems(readTray());
        setToken(readGoogleToken());
      }
    };
    window.addEventListener("relato-tray-changed", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      cancelled = true;
      window.removeEventListener("relato-tray-changed", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const pending = useMemo(
    () => (items ?? []).filter((item) => item.status === "pending"),
    [items],
  );
  const rejected = useMemo(
    () => (items ?? []).filter((item) => item.status === "rejected"),
    [items],
  );

  async function update(
    action: "reject" | "clearRejected",
    extra?: { id?: string },
  ) {
    let next = readTray();
    if (action === "reject" && extra?.id) next = rejectTrayItem(extra.id);
    if (action === "clearRejected") next = clearRejected();
    setItems(next);
    notifyTray();
    try {
      await apiPatchTray({ action, ...extra });
    } catch {
      /* the local bandeja already has the change */
    }
  }

  if (items === null) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-64 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <Badge variant="secondary">
          {pending.length} de {MAX_CANDIDATES} pendientes
        </Badge>
        <h1 className="font-heading text-3xl tracking-tight sm:text-4xl">
          Bandeja de candidatas
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Aquí llegan las fotos de este Picker, el de {houseLabel(house.from)}.
          Cuando quieras, pásalas a esa casa. Quedan pendientes. Nada se
          publica solo.
        </p>
        {pending.length > 0 ? (
          <SendToHouseButtons from={house.from} returnUrl={house.returnUrl} />
        ) : null}
      </section>

      {pending.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-start gap-3 py-10">
            <Inbox className="size-8 text-muted-foreground" />
            <div>
              <p className="font-medium">La bandeja está vacía</p>
              <p className="text-sm text-muted-foreground">
                Un cron no puede rellenarla. Envía el correo de este mes o
                abre el Picker.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {house.from === "relato" ? (
                <Button asChild>
                  <Link href="/invitar">Mandar correo</Link>
                </Button>
              ) : null}
              <Button variant={house.from === "relato" ? "outline" : "default"} asChild>
                <Link href={house.from === "mascotas" ? "/mascotas" : "/"}>
                  Elegir fotos
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {pending.map((item) => (
            <Card key={item.id} className="overflow-hidden py-0">
              <PhotoThumb
                photo={item}
                token={token}
                className="rounded-none"
              />
              <CardContent className="space-y-3 py-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{item.filename}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatWhen(item.createdAt)} ·{" "}
                      {item.source === "google_photos"
                        ? "Google Fotos"
                        : "Demo"}
                    </p>
                  </div>
                  <Badge variant="outline">Pendiente</Badge>
                </div>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => void update("reject", { id: item.id })}
                >
                  Rechazar
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {rejected.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-heading text-xl">Rechazadas</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void update("clearRejected")}
            >
              <Trash2 />
              Vaciar rechazadas
            </Button>
          </div>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {rejected.map((item) => (
              <li key={item.id}>{item.filename}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
