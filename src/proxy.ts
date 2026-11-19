import { auth } from "@/auth";

export default auth;

export const config = {
  // Il Proxy gira su ogni richiesta tranne asset statici, immagini ottimizzate,
  // le rotte dell'API di NextAuth e quelle dell'agente (protette da CRON_SECRET),
  // il service worker e la sua pagina "offline" (devono caricarsi anche senza sessione).
  matcher: ["/((?!api/auth|api/agent|api/digest|_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|offline.html|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)"],
};
