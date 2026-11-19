import type { MetadataRoute } from "next";

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
      { name: "Nuova daily", short_name: "Nuova daily", url: "/daily?nuova=1", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "Le daily di oggi", short_name: "Daily", url: "/daily", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "Obiettivi", short_name: "Obiettivi", url: "/obiettivi", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
    ],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
