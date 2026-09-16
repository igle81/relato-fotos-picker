"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { apiCreateHandoff } from "@/lib/client-api";
import { readGoogleToken } from "@/lib/google-token";
import { houseLabel, type HouseFrom } from "@/lib/remember-house";
import { houseBandejaUrl, withPickerQuery } from "@/lib/send-to-house";
import { readTray } from "@/lib/tray";

export function SendToHouseButtons({
  from,
  returnUrl,
}: {
  from: HouseFrom;
  returnUrl?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const house = houseLabel(from);

  async function send() {
    setError(null);
    const photos = readTray().filter((item) => item.status === "pending");
    if (photos.length === 0) {
      setError("No hay fotos pendientes. Elige primero en el Picker.");
      return;
    }
    setBusy(true);
    try {
      const handoff = await apiCreateHandoff({
        from,
        googleToken: readGoogleToken(),
        photos,
      });
      window.location.assign(
        withPickerQuery(houseBandejaUrl(from, returnUrl), {
          id: handoff.id,
          from,
          googleToken: readGoogleToken(),
          photos,
        }),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No pude preparar el envío a la bandeja.",
      );
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button disabled={busy} onClick={() => void send()}>
        {busy ? "Pasando…" : `Pasar a la bandeja de ${house}`}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
