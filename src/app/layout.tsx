import type { Metadata } from "next";
import { Fraunces, Geist_Mono, Source_Sans_3 } from "next/font/google";
import Script from "next/script";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Relato · Picker de Google Fotos",
  description:
    "Elige fotos a mano con el Picker oficial. Relato no puede escanear el rollo de Google Fotos cada mes.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${fraunces.variable} ${sourceSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <SiteHeader />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
          {children}
        </main>
        <footer className="border-t border-border/70 px-4 py-6 text-center text-xs text-muted-foreground">
          Relato no pide contraseñas. Google Fotos solo se abre con el Picker
          oficial, en una pestaña nueva.
        </footer>
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
