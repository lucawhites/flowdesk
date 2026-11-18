// Rigenera le icone dell'app (anello di avanzamento in vetro su fondo scuro, variante "A").
// Uso: node scripts/make-icons.mjs
// Se cambi il disegno, aggiorna anche src/components/app-logo.tsx.
import sharp from "sharp";

const defs = `
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#34322d"/><stop offset="1" stop-color="#0d0d0c"/>
    </linearGradient>
    <linearGradient id="orange" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f09a77"/><stop offset="1" stop-color="#c4613f"/>
    </linearGradient>
    <linearGradient id="sheen" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity="1"/><stop offset="0.45" stop-color="#fff" stop-opacity="0.15"/>
      <stop offset="0.5" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="edge" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity="0.55"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.05"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0.3"/>
    </linearGradient>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
    <filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.6"/></filter>
    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.4"/></filter>
  </defs>`;

const arc = (stroke, width) =>
  `<circle cx="50" cy="50" r="26" fill="none" stroke="${stroke}" stroke-width="${width}"
    stroke-linecap="round" stroke-dasharray="114 164" transform="rotate(-90 50 50)"/>`;
const check = (stroke) =>
  `<path d="M40 51l7 7 13-15" fill="none" stroke="${stroke}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`;

// Disegno ingrandito del 25%: riempie la zona sicura delle icone "maskable"
// (cerchio centrale dell'80%) senza uscirne.
const art = `
  <g transform="translate(50 50) scale(1.25) translate(-50 -50)">
    <circle cx="50" cy="50" r="26" fill="none" stroke="#fff" stroke-width="9" opacity="0.07"/>
    <g filter="url(#glow)" opacity="0.7">${arc("#d97757", 12)}</g>
    ${arc("url(#orange)", 9)}
    <g transform="translate(-1.6 -1.6)" opacity="0.55" filter="url(#soft)">${arc("#fff", 2.2)}</g>
    <g transform="translate(0 1.2)" opacity="0.35" filter="url(#shadow)">${check("#000")}</g>
    ${check("#f7f3ea")}
  </g>`;

// rx 22 = angoli arrotondati; rx 0 = a tutto campo (iPhone e icone "maskable"
// ritagliano da soli la forma, quindi niente bordo di luce).
const svg = (rx) =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${defs}
      <rect width="100" height="100" rx="${rx}" fill="url(#bg)"/>${art}
      <rect width="100" height="100" rx="${rx}" fill="url(#sheen)" opacity="0.2"/>
      ${rx ? `<rect x="0.6" y="0.6" width="98.8" height="98.8" rx="${rx - 0.5}" fill="none" stroke="url(#edge)" stroke-width="1.2"/>` : ""}
    </svg>`,
  );

const out = [
  ["public/icon-192.png", 192, 22],
  ["public/icon-512.png", 512, 22],
  ["public/icon-maskable-512.png", 512, 0],
  ["src/app/icon.png", 512, 22],
  ["src/app/apple-icon.png", 180, 0],
];

for (const [file, size, rx] of out) {
  await sharp(svg(rx), { density: 1200 }).resize(size, size).png().toFile(file);
  console.log(file);
}
