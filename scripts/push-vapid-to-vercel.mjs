// Copia le chiavi delle notifiche push (VAPID) dal file .env alle variabili di Vercel (produzione),
// senza mostrarle a schermo. Da lanciare una volta sola:
//   node --env-file=.env scripts/push-vapid-to-vercel.mjs
// Poi serve un nuovo deploy perché le variabili valgano.
import { execFileSync } from "node:child_process";

const NAMES = ["NEXT_PUBLIC_VAPID_PUBLIC_KEY", "VAPID_PRIVATE_KEY", "VAPID_SUBJECT"];

for (const name of NAMES) {
  const value = process.env[name];
  if (!value) {
    console.error(`Manca ${name} nel file .env`);
    process.exit(1);
  }
  // Se esiste già, la sostituisce.
  try {
    execFileSync("npx", ["vercel", "env", "rm", name, "production", "--yes", "--scope", "elitter"], { stdio: "ignore" });
  } catch {
    // Non c'era: va bene.
  }
  execFileSync("npx", ["vercel", "env", "add", name, "production", "--value", value, "--yes", "--scope", "elitter"], {
    stdio: ["ignore", "ignore", "inherit"],
  });
  console.log(`✓ ${name} salvata su Vercel`);
}
console.log("Fatto. Ora serve un nuovo deploy perché le notifiche si attivino.");
