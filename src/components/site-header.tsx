"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { apiReadTray } from "@/lib/client-api";
import { pendingCount, readTray } from "@/lib/tray";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const pathname = usePathname();
  const [pending, setPending] = useState(0);
  const inviteFlow = pathname.startsWith("/i/");

  useEffect(() => {
    const refresh = async () => {
      const local = readTray();
      setPending(pendingCount(local));
      if (local.length > 0) return;
      try {
        const remote = await apiReadTray();
        if (remote.length > 0) setPending(pendingCount(remote));
      } catch {
        /* keep the local count */
      }
    };
    void refresh();
    const onChange = () => {
      void refresh();
    };
    window.addEventListener("relato-tray-changed", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("relato-tray-changed", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [pathname]);

  const linkClass = (href: string) =>
    cn(
      "rounded-full px-3 py-1.5",
      pathname === href
        ? "bg-primary text-primary-foreground"
        : "text-muted-foreground hover:bg-muted hover:text-foreground",
    );

  return (
    <header className="border-b border-border/80 bg-card/70 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="min-w-0">
          <p className="font-heading text-xl tracking-tight">Relato</p>
          <p className="text-xs text-muted-foreground">Picker de Google Fotos</p>
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-1 text-sm">
          {inviteFlow ? (
            <Link href="/bandeja" className={linkClass("/bandeja")}>
              Bandeja{pending > 0 ? ` (${pending})` : ""}
            </Link>
          ) : (
            <>
              <Link href="/" className={linkClass("/")}>
                Elegir
              </Link>
              <Link href="/invitar" className={linkClass("/invitar")}>
                Correo
              </Link>
              <Link href="/bandeja" className={linkClass("/bandeja")}>
                Bandeja{pending > 0 ? ` (${pending})` : ""}
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
