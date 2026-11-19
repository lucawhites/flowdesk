// Rigenera le icone dell'app: monogramma F in vetro arancio su grafite (variante "E1").
// Uso: node scripts/make-icons.mjs
// Se cambi il disegno, aggiorna anche src/components/app-logo.tsx.
//
// Qualità: l'SVG viene rasterizzato a 1200 dpi (≈1700 px) e poi ridotto con Lanczos,
// così bordi, sfumature e bagliori restano nitidi a ogni misura.
import sharp from "sharp";

const defs = `
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#3d3d44"/><stop offset="1" stop-color="#0f0f11"/>
    </linearGradient>
    <linearGradient id="orange" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffb08a"/><stop offset="1" stop-color="#e2501c"/>
    </linearGradient>
    <linearGradient id="orangeV" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffb894"/><stop offset="1" stop-color="#e2501c"/>
    </linearGradient>
    <linearGradient id="sheen" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset=".45" stop-color="#fff" stop-opacity=".1"/>
      <stop offset=".5" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="edge" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity=".6"/><stop offset=".5" stop-color="#fff" stop-opacity=".04"/>
      <stop offset="1" stop-color="#fff" stop-opacity=".25"/>
    </linearGradient>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="10"/></filter>
    <filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.2"/></filter>
  </defs>`;

// Pillola = rettangolo con punte tonde; bordo di luce e riflesso in alto le fanno sembrare vetro.
const pill = (x, y, w, h, fill, opacity) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${Math.min(w, h) / 2}" fill="${fill}" opacity="${opacity}"/>`;
const rim = (x, y, w, h) =>
  `<rect x="${x + 0.4}" y="${y + 0.4}" width="${w - 0.8}" height="${h - 0.8}" rx="${Math.min(w, h) / 2 - 0.4}" fill="none" stroke="url(#edge)" stroke-width=".8"/>`;
const highlight = (x, y, w, r) =>
  `<path d="M${x + r} ${y + 1.6}h${w - 2 * r}" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".7" filter="url(#soft)"/>`;

// La F: asta, braccio alto, braccio centrale. Spostata di 2 a destra perché l'asta
// pesa più dei bracci: così la lettera sembra centrata (centratura ottica).
// Sta tutta nel cerchio centrale dell'80%, la zona sicura delle icone "maskable".
const art = `
  <ellipse cx="51" cy="54" rx="22" ry="24" fill="#f27a4c" opacity=".42" filter="url(#glow)"/>
  <g transform="translate(2 0)">
    ${pill(31, 22, 15, 57, "url(#orangeV)", 0.92)}
    ${pill(31, 22, 40, 15, "url(#orange)", 0.88)}
    ${pill(31, 45, 30, 14, "url(#orange)", 0.85)}
    ${rim(31, 22, 15, 57)}${rim(31, 22, 40, 15)}${rim(31, 45, 30, 14)}
    ${highlight(31, 22, 40, 7.5)}${highlight(31, 45, 30, 7)}
  </g>`;

// rx 22 = angoli arrotondati con bordo di luce; rx 0 = a tutto campo (iPhone e icone
// "maskable" ritagliano da soli la forma, quindi niente bordo).
const svg = (rx) =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${defs}
      <rect width="100" height="100" rx="${rx}" fill="url(#bg)"/>${art}
      <rect width="100" height="100" rx="${rx}" fill="url(#sheen)" opacity=".16"/>
      ${rx ? `<rect x=".6" y=".6" width="98.8" height="98.8" rx="${rx - 0.5}" fill="none" stroke="url(#edge)" stroke-width="1.1"/>` : ""}
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
  await sharp(svg(rx), { density: 1200 })
    .resize(size, size, { kernel: "lanczos3" })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(file);
  console.log(file);
}
