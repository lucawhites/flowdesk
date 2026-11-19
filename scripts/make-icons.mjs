// Rigenera le icone dell'app: monogramma F in vetro arancio pieno su grigio nebbia
// (variante "1d-E": F piena, nitida e un po' più grande; stile vetro come barra e pulsanti dell'app).
// Uso: node scripts/make-icons.mjs   (poi node scripts/make-splash.mjs per le schermate di avvio)
// Se cambi il disegno, aggiorna anche src/components/app-logo.tsx.
//
// Qualità: l'SVG viene rasterizzato a 1200 dpi (≈1700 px) e poi ridotto con Lanczos,
// così bordi, sfumature e riflessi restano nitidi a ogni misura.
import sharp from "sharp";

const defs = `
  <defs>
    <radialGradient id="bg" cx="0.3" cy="0.2" r="0.95">
      <stop offset="0" stop-color="#eeeef0"/><stop offset="0.6" stop-color="#dcdde1"/><stop offset="1" stop-color="#c6c8ce"/>
    </radialGradient>
    <linearGradient id="orange" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffb08a"/><stop offset="1" stop-color="#e2501c"/>
    </linearGradient>
    <linearGradient id="orangeV" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ff9a6a"/><stop offset="1" stop-color="#d8461a"/>
    </linearGradient>
    <linearGradient id="sheen" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset=".45" stop-color="#fff" stop-opacity=".1"/>
      <stop offset=".5" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="edge" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity=".7"/><stop offset=".5" stop-color="#fff" stop-opacity=".05"/>
      <stop offset="1" stop-color="#fff" stop-opacity=".3"/>
    </linearGradient>
    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.2"/></filter>
    <filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.2"/></filter>
  </defs>`;

// Pillola = rettangolo con punte tonde; bordo di luce e riflesso in alto le fanno sembrare vetro.
const pill = (x, y, w, h, fill, opacity = 1) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${Math.min(w, h) / 2}" fill="${fill}" opacity="${opacity}"/>`;
const rim = (x, y, w, h) =>
  `<rect x="${x + 0.4}" y="${y + 0.4}" width="${w - 0.8}" height="${h - 0.8}" rx="${Math.min(w, h) / 2 - 0.4}" fill="none" stroke="url(#edge)" stroke-width=".9"/>`;
const highlight = (x, y, w, r) =>
  `<path d="M${x + r} ${y + 1.7}h${w - 2 * r}" stroke="#fff" stroke-width="1.7" stroke-linecap="round" opacity=".85" filter="url(#soft)"/>`;

// La F: asta, braccio alto, braccio centrale. x = 33 (2 a destra del centro geometrico) per la
// centratura ottica, poi ingrandita del 10%. Sta nel cerchio centrale dell'80%, zona sicura delle
// icone "maskable". F piena (non trasparente) con ombra corta e netta: si legge bene anche piccola.
const S = [33, 22, 15, 57], T = [33, 22, 40, 15], M = [33, 45, 30, 14];
const art = `
  <g transform="translate(52 50) scale(1.1) translate(-53 -50.5)">
    <g opacity=".28" filter="url(#shadow)" transform="translate(0 1.6)">
      ${pill(...S, "#7a240a")}${pill(...T, "#7a240a")}${pill(...M, "#7a240a")}
    </g>
    ${pill(...S, "url(#orangeV)")}${pill(...T, "url(#orangeV)")}${pill(...M, "url(#orangeV)")}
    ${rim(...S)}${rim(...T)}${rim(...M)}
    ${highlight(T[0], T[1], T[2], 7.5)}${highlight(M[0], M[1], M[2], 7)}
  </g>`;

// rx 22 = angoli arrotondati con filo di contorno; rx 0 = a tutto campo (iPhone e icone
// "maskable" ritagliano da soli la forma, quindi niente contorno).
const svg = (rx) =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${defs}
      <rect width="100" height="100" rx="${rx}" fill="url(#bg)"/>${art}
      <rect width="100" height="100" rx="${rx}" fill="url(#sheen)" opacity=".24"/>
      ${rx ? `<rect x=".5" y=".5" width="99" height="99" rx="${rx - 0.5}" fill="none" stroke="#000" stroke-opacity=".08"/>` : ""}
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
