// Rigenera le icone dell'app (anello di avanzamento su fondo scuro).
// Uso: node scripts/make-icons.mjs
import sharp from "sharp";

const art = `
  <circle cx="50" cy="50" r="26" fill="none" stroke="#33322d" stroke-width="9"/>
  <circle cx="50" cy="50" r="26" fill="none" stroke="#d97757" stroke-width="9"
    stroke-linecap="round" stroke-dasharray="114 164" transform="rotate(-90 50 50)"/>
  <path d="M40 51l7 7 13-15" fill="none" stroke="#f4f2eb" stroke-width="6"
    stroke-linecap="round" stroke-linejoin="round"/>`;

// rx 22 = angoli arrotondati; rx 0 = a tutto campo (iPhone e icone "maskable"
// ritagliano da soli la forma).
const svg = (rx) =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect width="100" height="100" rx="${rx}" fill="#141413"/>${art}
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
  await sharp(svg(rx), { density: 600 }).resize(size, size).png().toFile(file);
  console.log(file);
}
