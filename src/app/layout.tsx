import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import "./globals.css";
import { SPLASH_SCREENS } from "@/lib/splash-screens";
import { THEME_COLORS } from "@/lib/theme-color";

// Applica tema, dimensione del testo e sfondo (pieno salvo scelta «vetro») prima del primo disegno, per evitare lampi e salti.
// Tema: "light" o "dark" scelti a mano, altrimenti Automatico = segue l'iPhone/il computer,
// anche quando cambia mentre l'app è aperta (es. la sera). Così la barra di stato dell'app
// installata, che iOS colora in base al proprio aspetto, coincide sempre con l'app.
const themeScript = `(function(){try{var m=matchMedia("(prefers-color-scheme: dark)");var apply=function(){var t=localStorage.getItem("theme");if(t!=="light"&&t!=="dark"){t=m.matches?"dark":"light"}document.documentElement.dataset.theme=t};apply();m.addEventListener("change",function(){var t=localStorage.getItem("theme");if(t!=="light"&&t!=="dark")apply()});var p=localStorage.getItem("palette");if(p==="indigo"||p==="teal"||p==="warm"||p==="lime"||p==="elitter"){document.documentElement.dataset.palette=p}var z=localStorage.getItem("textSize");if(z==="s"||z==="l"||z==="xl"){document.documentElement.dataset.textSize=z}var b=localStorage.getItem("sfondo");document.documentElement.dataset.sfondo=b==="vetro"?"vetro":"pieno";var k=Number(localStorage.getItem("vetroIntensita"));if(k>=0&&k<=100&&localStorage.getItem("vetroIntensita")!==null){document.documentElement.style.setProperty("--vetro",String(k/100))}}catch(e){}})()`;

export const metadata: Metadata = {
  title: "Flowdesk · Task del team",
  description: "Progetti, obiettivi e daily del team Elitter.",
  // App installata su iPhone: nome sotto l'icona, barra di stato e schermata di avvio.
  appleWebApp: {
    capable: true,
    title: "Flowdesk",
    statusBarStyle: "default",
    startupImage: SPLASH_SCREENS,
  },
  formatDetection: { telephone: false },
};

// viewportFit "cover" serve per leggere la safe area (barra home dell'iPhone) nella barra in basso.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // Colore iniziale della barra di stato; poi segue il tema scelto in Flowdesk (src/lib/theme-color.ts).
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: THEME_COLORS.light },
    { media: "(prefers-color-scheme: dark)", color: THEME_COLORS.dark },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="it"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <Toaster
          position="bottom-right"
          // Sul telefono le notifiche stanno sopra la capsula in basso.
          mobileOffset={{ bottom: "calc(5.5rem + env(safe-area-inset-bottom))" }}
          toastOptions={{
            className: "glass",
            style: {
              color: "var(--foreground)",
              border: "1px solid var(--border)",
            },
          }}
        />
      </body>
    </html>
  );
}
