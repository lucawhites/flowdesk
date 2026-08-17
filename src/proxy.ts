import { auth } from "@/auth";

export default auth;

export const config = {
  // Il Proxy gira su ogni richiesta tranne asset statici, immagini ottimizzate
  // e le rotte dell'API di NextAuth (che devono restare raggiungibili da anonimi).
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)"],
};
