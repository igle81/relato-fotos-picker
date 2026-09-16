"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PickerApp } from "@/components/picker-app";
import { Skeleton } from "@/components/ui/skeleton";
import { apiReadInvite } from "@/lib/client-api";

export default function InvitePickPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [name, setName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Falta el enlace de invitación.");
      return;
    }
    let cancelled = false;
    apiReadInvite(token)
      .then((invite) => {
        if (cancelled) return;
        setName(invite.name);
        setReady(true);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(
          err instanceof Error
            ? err.message
            : "Este enlace no vale. Pide otro correo a Relato.",
        );
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle />
        <AlertTitle>No se puede elegir fotos con este enlace</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!ready) {
    return <Skeleton className="h-64 w-full rounded-xl" />;
  }

  return <PickerApp inviteToken={token} inviteName={name} />;
}
