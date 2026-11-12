import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

// Applica tema e dimensione del testo prima del primo disegno, per evitare lampi e salti.
const themeScript = `(function(){try{var t=localStorage.getItem("theme");if(t!=="light"&&t!=="dark"){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=t;var z=localStorage.getItem("textSize");if(z==="s"||z==="l"||z==="xl"){document.documentElement.dataset.textSize=z}}catch(e){}})()`;

export const metadata: Metadata = {
  title: "Flowdesk · Task del team",
  description: "Progetti, obiettivi e daily del team Elitter.",
};

// viewportFit "cover" serve per leggere la safe area (barra home dell'iPhone) nella barra in basso.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="it"
      className={`${manrope.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <Toaster
          position="bottom-right"
          mobileOffset={{ bottom: "calc(4.5rem + env(safe-area-inset-bottom))" }}
          toastOptions={{
            style: {
              background: "var(--surface)",
              color: "var(--foreground)",
              border: "1px solid var(--border)",
            },
          }}
        />
      </body>
    </html>
  );
}
