import { auth } from "@/auth";

export default auth;

export const config = {
  // Il Proxy gira su ogni richiesta tranne asset statici, immagini ottimizzate,
  // le rotte dell'API di NextAuth e quelle dell'agente (protette da CRON_SECRET).
  matcher: ["/((?!api/auth|api/agent|api/digest|_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)"],
};
