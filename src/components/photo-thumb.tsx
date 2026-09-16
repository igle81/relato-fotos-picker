"use client";

import { useEffect, useState } from "react";
import { apiFileObjectUrl } from "@/lib/client-api";
import type { PickedPhoto } from "@/lib/types";
import { cn } from "@/lib/utils";

function isDirectThumb(photo: PickedPhoto) {
  return (
    photo.source === "demo" ||
    photo.thumbnailUrl.startsWith("data:") ||
    photo.thumbnailUrl.startsWith("/")
  );
}

export function PhotoThumb({
  photo,
  token,
  className,
}: {
  photo: PickedPhoto;
  token: string | null;
  className?: string;
}) {
  const [src, setSrc] = useState(isDirectThumb(photo) ? photo.thumbnailUrl : "");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
    if (isDirectThumb(photo)) {
      setSrc(photo.thumbnailUrl);
      return;
    }
    if (!token) {
      setSrc("");
      return;
    }
    let objectUrl = "";
    let cancelled = false;
    apiFileObjectUrl(token, photo.thumbnailUrl, "thumb")
      .then((url) => {
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        objectUrl = url;
        setSrc(url);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [photo.id, photo.source, photo.thumbnailUrl, token]);

  return (
    <div
      className={cn(
        "relative aspect-[4/3] w-full overflow-hidden bg-accent ring-1 ring-border",
        className,
      )}
    >
      {src && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={photo.filename}
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center px-3 text-center text-xs text-accent-foreground">
          {failed ? "Sin miniatura" : photo.filename}
        </div>
      )}
    </div>
  );
}
