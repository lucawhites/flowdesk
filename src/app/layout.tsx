import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import "./globals.css";
import { SPLASH_SCREENS } from "@/lib/splash-screens";
import { THEME_COLORS } from "@/lib/theme-color";

// Applica tema e dimensione del testo prima del primo disegno, per evitare lampi e salti.
// Tema: "light" o "dark" scelti a mano, altrimenti Automatico = segue l'iPhone/il computer,
// anche quando cambia mentre l'app è aperta (es. la sera). Così la barra di stato dell'app
// installata, che iOS colora in base al proprio aspetto, coincide sempre con l'app.
const themeScript = `(function(){try{var m=matchMedia("(prefers-color-scheme: dark)");var apply=function(){var t=localStorage.getItem("theme");if(t!=="light"&&t!=="dark"){t=m.matches?"dark":"light"}document.documentElement.dataset.theme=t};apply();m.addEventListener("change",function(){var t=localStorage.getItem("theme");if(t!=="light"&&t!=="dark")apply()});var z=localStorage.getItem("textSize");if(z==="s"||z==="l"||z==="xl"){document.documentElement.dataset.textSize=z}}catch(e){}})()`;

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
