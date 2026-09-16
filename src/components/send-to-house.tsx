"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { apiCreateHandoff } from "@/lib/client-api";
import { readGoogleToken } from "@/lib/google-token";
import { houseBandejaUrl, withPickerQuery } from "@/lib/send-to-house";
import { readTray } from "@/lib/tray";

export function SendToHouseButtons({
  from,
  returnUrl,
}: {
  from?: "relato" | "mascotas";
  returnUrl?: string;
}) {
  const [busy, setBusy] = useState<"relato" | "mascotas" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function send(target: "relato" | "mascotas") {
    setError(null);
    const photos = readTray().filter((item) => item.status === "pending");
    if (photos.length === 0) {
      setError("No hay fotos pendientes. Elige primero en el Picker.");
      return;
    }
    setBusy(target);
    try {
      const handoff = await apiCreateHandoff({
        from: target,
        googleToken: readGoogleToken(),
        photos,
      });
      window.location.assign(
        withPickerQuery(
          houseBandejaUrl(target, target === from ? returnUrl : undefined),
          {
            id: handoff.id,
            from: target,
            googleToken: readGoogleToken(),
            photos,
          },
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No pude preparar el envío a la bandeja.",
      );
      setBusy(null);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button
          disabled={busy !== null}
          onClick={() => void send("relato")}
        >
          {busy === "relato" ? "Pasando…" : "Pasar a la bandeja de Relato"}
        </Button>
        <Button
          variant="outline"
          disabled={busy !== null}
          onClick={() => void send("mascotas")}
        >
          {busy === "mascotas" ? "Pasando…" : "Pasar a Relato Mascotas"}
        </Button>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
