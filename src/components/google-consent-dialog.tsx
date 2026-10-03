"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GOOGLE_CONSENT } from "@/lib/legal-copy";

export function GoogleConsentDialog({
  open,
  busy,
  onAccept,
  onDecline,
}: {
  open: boolean;
  busy: boolean;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    dialogRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onDecline();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onDecline]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-4 sm:items-center">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="google-consent-title"
        tabIndex={-1}
        className="w-full max-w-lg space-y-4 rounded-xl bg-card p-6 text-card-foreground shadow-lg ring-1 ring-foreground/10 outline-none"
      >
        <h2 id="google-consent-title" className="font-heading text-2xl">
          {GOOGLE_CONSENT.title}
        </h2>
        <div className="space-y-3 text-sm leading-relaxed">
          {GOOGLE_CONSENT.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          <p>
            Antes de seguir puedes leer la{" "}
            <Link
              href={GOOGLE_CONSENT.privacyHref}
              className="underline"
              target="_blank"
              rel="noreferrer"
            >
              {GOOGLE_CONSENT.privacyLabel}
            </Link>
            .
          </p>
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onDecline} disabled={busy}>
            {GOOGLE_CONSENT.decline}
          </Button>
          <Button type="button" onClick={onAccept} disabled={busy}>
            {GOOGLE_CONSENT.accept}
          </Button>
        </div>
      </div>
    </div>
  );
}
