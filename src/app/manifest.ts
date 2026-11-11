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
    background_color: "#f4f2eb",
    theme_color: "#f4f2eb",
    lang: "it",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
