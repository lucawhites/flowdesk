// Import una tantum degli obiettivi "OBJ 2026" (Projects Map.xlsx) in Flowdesk.
// Uso: node --env-file=.env scripts/import-obj-2026.mjs [--apply]
// Senza --apply mostra solo cosa farebbe. Idempotente: salta progetti/obiettivi già presenti.
import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import pg from "pg";

const apply = process.argv.includes("--apply");
const data = JSON.parse(readFileSync(new URL("./data/obj-2026.json", import.meta.url), "utf8"));

const PEOPLE = {
  luca: { email: "production@elitter.it", areas: ["Produzione", "Social media GFP", "Management", "CRM"] },
  francesca: { email: "francesca@elitter.it", name: "Francesca", areas: ["Commerciale", "Social media", "Marketing", "Collab"] },
  alessandro: { email: "alessandro.columbano@elitter.it", name: "Alessandro Columbano", areas: ["Sales", "Commerciale", "Collab", "CRM"] },
};

const KEEP = ["VIP", "CRM", "IG", "E.L.", "EL", "ELITTER", "D'ESTE", "TIK", "TOK", "PJCT", "MAP", "FRANZ", "KRALER", "WAKAKA", "NASSIB", "VILLA", "ALINA", "TRAFFIC", "FACEBOOK", "INSTAGRAM", "ALE:"];
const NICE = { ELITTER: "Elitter", "D'ESTE": "d'Este", TIK: "Tik", TOK: "Tok", FRANZ: "Franz", KRALER: "Kraler", WAKAKA: "Wakaka", NASSIB: "Nassib", VILLA: "Villa", ALINA: "Alina", TRAFFIC: "Traffic", FACEBOOK: "Facebook", INSTAGRAM: "Instagram", "ALE:": "Ale:", MAP: "Map", PJCT: "Project" };
function sentence(title) {
  const words = title.replace(/\s+/g, " ").replace(/PERCHE'/g, "PERCHÉ").replace(/PIU'/g, "PIÙ").replace(/RESPONSABILITA'/g, "RESPONSABILITÀ").replace(/CONGIERGE/g, "CONCIERGE").replace(/CREAIAMO/g, "CREIAMO").split(" ");
  return words
    .map((w, i) => {
      const bare = w.replace(/^["(]+|[",)]+$/g, "");
      if (KEEP.includes(bare)) return w.replace(bare, NICE[bare] ?? bare);
      const low = w.toLowerCase();
      return i === 0 ? low.charAt(0).toUpperCase() + low.slice(1) : low;
    })
    .join(" ");
}
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const id = () => "c" + randomBytes(12).toString("hex");

const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
await db.connect();
try {
  await db.query("BEGIN");
  const { rows: [luca] } = await db.query(`select id, "teamId" from "User" where email=$1`, [PEOPLE.luca.email]);
  const teamId = luca.teamId;
  const userIds = { luca: luca.id };
  await db.query(`update "User" set areas=$1 where id=$2`, [PEOPLE.luca.areas, luca.id]);

  for (const key of ["francesca", "alessandro"]) {
    const p = PEOPLE[key];
    const found = await db.query(`select id from "User" where email=$1`, [p.email]);
    if (found.rows[0]) {
      userIds[key] = found.rows[0].id;
      await db.query(`update "User" set areas=$1 where id=$2`, [p.areas, userIds[key]]);
    } else {
      // Utente invitato: passwordHash vuota = account da attivare con la registrazione.
      userIds[key] = id();
      await db.query(
        `insert into "User"(id,name,email,"passwordHash",role,"teamId",areas) values($1,$2,$3,'','MEMBER',$4,$5)`,
        [userIds[key], p.name, p.email, teamId, p.areas],
      );
      console.log("+ utente invitato", p.email);
    }
  }

  const projectIds = {};
  for (const name of data.projects) {
    const found = await db.query(`select id from "Project" where "teamId"=$1 and name=$2`, [teamId, name]);
    projectIds[name] = found.rows[0]?.id ?? id();
    if (!found.rows[0]) {
      await db.query(`insert into "Project"(id,name,description,"teamId") values($1,$2,$3,$4)`, [projectIds[name], name, "Obiettivi 2026 dalla Project Map", teamId]);
      console.log("+ progetto", name);
    }
  }

  let created = 0;
  for (const o of data.objectives) {
    const title = sentence(o.title);
    const exists = await db.query(`select id from "Objective" where "teamId"=$1 and title=$2`, [teamId, title]);
    if (exists.rows[0]) continue;
    const oid = id();
    await db.query(
      `insert into "Objective"(id,title,description,"teamId","projectId","assigneeId","creatorId","metricLabel","metricUnit","metricTarget","metricCurrent","metricApproved","inFocus")
       values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,false,$12)`,
      [oid, title, o.stepsProposed ? "Passi proposti dall'agente (il foglio non li aveva)." : null, teamId, projectIds[o.area], userIds[o.owner], luca.id,
        o.metric.label, o.metric.unit, o.metric.target, o.metric.current, o.inFocus],
    );
    for (const [i, step] of o.steps.entries()) {
      await db.query(`insert into "ObjectiveStep"(id,position,title,"objectiveId","completedAt") values($1,$2,$3,$4,$5)`, [
        id(), i + 1, cap(step), oid, i < o.stepsDone ? new Date() : null,
      ]);
    }
    created++;
    console.log(`+ ${o.inFocus ? "★" : " "} [${o.area}] ${title} — ${o.stepsDone}/${o.steps.length} passi`);
  }
  console.log(`\n${created} obiettivi nuovi.`);
  await db.query(apply ? "COMMIT" : "ROLLBACK");
  console.log(apply ? "Import salvato." : "Prova a secco: niente salvato (aggiungi --apply).");
} catch (e) {
  await db.query("ROLLBACK");
  throw e;
} finally {
  await db.end();
}
