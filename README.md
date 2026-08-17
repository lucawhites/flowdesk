# Flowdesk — Task del team

> Deploy automatico da GitHub attivo.

Web app per gestire le task giornaliere, settimanali e mensili del team, con login tramite email aziendale e una vista d'insieme di tutto ciò che è completato o ancora da fare.

## Stack tecnico

- **Next.js 16** (App Router, React 19)
- **NextAuth v5** — autenticazione con email + password (bcrypt, sessioni JWT)
- **Prisma 7** — ORM, con SQLite in sviluppo e Postgres in produzione
- **Tailwind CSS v4** + componenti Radix UI

## Come funziona il login e i team

Non serve creare account manualmente uno per uno: chi si registra per primo con un'email aziendale (es. `mario@acme.com`) crea automaticamente il workspace del team **Acme** e ne diventa amministratore. Ogni collega che si registra con la stessa parte dopo la @ (`@acme.com`) entra automaticamente nello stesso workspace, come membro.

## Sviluppo locale

Requisiti: Node.js 20+.

```bash
npm install
npx prisma migrate dev
npm run dev
```

L'app sarà disponibile su `http://localhost:3000`. Il database di sviluppo è un file SQLite (`prisma/dev.db`), creato automaticamente al primo `migrate dev` — nessuna installazione esterna necessaria.

Apri `http://localhost:3000/register` e crea il primo account: diventerai automaticamente amministratore del tuo team.

### Variabili d'ambiente (`.env`)

| Variabile | Descrizione |
|---|---|
| `DATABASE_URL` | Connessione al database. In locale: `file:./dev.db`. In produzione: connection string Postgres. |
| `AUTH_SECRET` | Chiave per firmare sessioni/cookie. Generane una nuova per la produzione con `openssl rand -base64 32`. |

## Portare l'app online (Vercel + Postgres)

L'app è pronta per il deploy, ma richiede due passaggi manuali perché tocchino account esterni (Vercel, provider del database): **vanno fatti da te**, qui sotto trovi la procedura esatta.

### 1. Passa da SQLite a Postgres

SQLite va benissimo in locale, ma su Vercel il filesystem non è persistente: in produzione serve un database Postgres vero (es. [Neon](https://neon.tech), che ha un piano gratuito, oppure Vercel Postgres/Supabase).

1. Crea un database Postgres con il provider che preferisci e copia la sua connection string (`postgres://...`).
2. In `prisma/schema.prisma`, cambia:
   ```prisma
   datasource db {
     provider = "sqlite"
   }
   ```
   in:
   ```prisma
   datasource db {
     provider = "postgresql"
   }
   ```
3. In `prisma.config.ts`, la riga `datasource.url` legge già `DATABASE_URL` dall'ambiente: non serve modificarla.
4. Rigenera il client e crea le tabelle sul nuovo database:
   ```bash
   DATABASE_URL="postgres://...la-tua-connection-string..." npx prisma migrate deploy
   npx prisma generate
   ```

`src/lib/prisma.ts` sceglie automaticamente l'adapter giusto (SQLite o Postgres) in base al prefisso di `DATABASE_URL`, quindi non serve toccare altro codice.

### 2. Deploy su Vercel

1. Carica il progetto su GitHub (o GitLab/Bitbucket).
2. Su [vercel.com](https://vercel.com), importa il repository, impostando come **Root Directory** la cartella `team-tasks-app` (se il repo contiene anche altri progetti).
3. Aggiungi le variabili d'ambiente del progetto su Vercel:
   - `DATABASE_URL` → la connection string Postgres del punto precedente
   - `AUTH_SECRET` → una nuova chiave generata con `openssl rand -base64 32` (non riusare quella di sviluppo)
4. Avvia il deploy. Al termine, apri l'URL assegnato da Vercel, vai su `/register` e crea il primo account: sarà l'amministratore del team.
5. Condividi il link con i colleghi: chi si registra con la stessa email aziendale entrerà automaticamente nello stesso team.

### Aggiornamenti futuri dello schema database

Ogni volta che modifichi `prisma/schema.prisma`, genera una nuova migrazione in locale e poi applicala in produzione:

```bash
npx prisma migrate dev --name descrizione_modifica   # in locale, crea la migrazione
git push                                              # Vercel farà il deploy
DATABASE_URL="postgres://..." npx prisma migrate deploy   # applica la migrazione al DB di produzione
```

## Struttura del progetto

```
src/
  app/
    (auth)/login, (auth)/register   → pagine pubbliche di accesso
    (app)/dashboard                 → le task del singolo utente (giornaliere/settimanali/mensili)
    (app)/team                      → panoramica di tutte le task del team
    (app)/tasks/actions.ts          → server actions per creare/modificare/completare/eliminare task
  auth.ts                           → configurazione NextAuth (credenziali, sessione, autorizzazione)
  proxy.ts                          → protezione delle rotte (redirect a /login se non autenticati)
  lib/prisma.ts                     → client Prisma (SQLite in dev, Postgres in produzione)
  components/                       → componenti UI riutilizzabili
prisma/schema.prisma                → modello dati (Team, User, Task)
```
