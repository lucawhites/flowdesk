// Imposta una password nuova per una persona del team (es. password dimenticata).
// La password si scrive nel Terminale senza che compaia e si salva solo cifrata (bcrypt),
// come fa la registrazione. Conferma anche l'email, se non era confermata.
// Uso:
//   node --env-file=.env scripts/set-password.mjs francesca@elitter.it
import pg from "pg";
import bcrypt from "bcryptjs";

const email = (process.argv[2] ?? "").trim().toLowerCase();
if (!email.includes("@")) {
  console.error("Indica l'email: node --env-file=.env scripts/set-password.mjs nome@elitter.it");
  process.exit(1);
}

// Legge una riga senza mostrarla (asterischi al posto dei caratteri).
function askHidden(question) {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    process.stdout.write(question);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    let value = "";
    const onData = (char) => {
      if (char === "\r" || char === "\n" || char === "\u0004") {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener("data", onData);
        process.stdout.write("\n");
        resolve(value);
      } else if (char === "\u0003") {
        process.stdout.write("\nAnnullato.\n");
        process.exit(1);
      } else if (char === "\u007f" || char === "\b") {
        if (value.length > 0) {
          value = value.slice(0, -1);
          process.stdout.write("\b \b");
        }
      } else {
        value += char;
        process.stdout.write("*".repeat(char.length));
      }
    };
    stdin.on("data", onData);
  });
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  const { rows } = await client.query('SELECT id, name FROM "User" WHERE email = $1', [email]);
  if (rows.length === 0) {
    console.error(`Nessuna persona con email ${email}.`);
    process.exit(1);
  }
  console.log(`Password nuova per ${rows[0].name} (${email}).`);
  const password = await askHidden("Password (almeno 8 caratteri): ");
  if (password.length < 8) {
    console.error("Troppo corta: servono almeno 8 caratteri. Nulla è stato cambiato.");
    process.exit(1);
  }
  const again = await askHidden("Ripetila: ");
  if (again !== password) {
    console.error("Le due password non coincidono. Nulla è stato cambiato.");
    process.exit(1);
  }
  const hash = await bcrypt.hash(password, 10);
  await client.query(
    'UPDATE "User" SET "passwordHash" = $1, "emailVerified" = COALESCE("emailVerified", now()) WHERE id = $2',
    [hash, rows[0].id]
  );
  console.log(`✓ Fatto: ${rows[0].name} può entrare con la password nuova.`);
} finally {
  await client.end();
}
