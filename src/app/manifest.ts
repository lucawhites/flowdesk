import type { MetadataRoute } from "next";

// Versione delle icone: cambiandola, browser e app installate (anche su Mac) scaricano quelle nuove
// invece di tenere la copia vecchia. Aggiornarla ogni volta che si rifanno le icone.
const ICON_VERSION = "2026-11-20";
const icon = (file: string) => `/${file}?v=${ICON_VERSION}`;

// Rende Flowdesk installabile come app (Chrome: "Apri nell'app" / "Installa").
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Flowdesk · Task del team",
    short_name: "Flowdesk",
    description: "Progetti, obiettivi e daily del team Elitter",
    start_url: "/home",
    scope: "/",
    display: "standalone",
    background_color: "#f6f6f7",
    theme_color: "#f6f6f7",
    lang: "it",
    // Tenendo premuta l'icona (Android, Chrome su computer). Su iPhone si usano i Comandi rapidi
    // con il link /daily?nuova=1.
    shortcuts: [
      { name: "Nuova daily", short_name: "Nuova daily", url: "/daily?nuova=1", icons: [{ src: icon("icon-192.png"), sizes: "192x192" }] },
      { name: "Le daily di oggi", short_name: "Daily", url: "/daily", icons: [{ src: icon("icon-192.png"), sizes: "192x192" }] },
      { name: "Obiettivi", short_name: "Obiettivi", url: "/obiettivi", icons: [{ src: icon("icon-192.png"), sizes: "192x192" }] },
    ],
    icons: [
      { src: icon("icon-192.png"), sizes: "192x192", type: "image/png" },
      { src: icon("icon-512.png"), sizes: "512x512", type: "image/png" },
      { src: icon("icon-maskable-512.png"), sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
