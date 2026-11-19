// Schermate di avvio dell'app installata su iPhone (al posto del lampo bianco all'apertura):
// icona al centro su fondo chiaro o scuro, una per ogni misura di iPhone.
// Uso: node scripts/make-splash.mjs  (dopo make-icons.mjs, perché parte da public/icon-512.png)
// L'elenco SPLASH_SCREENS va tenuto uguale a quello in src/lib/splash-screens.ts.
import sharp from "sharp";
import { mkdirSync } from "node:fs";

// [larghezza pt, altezza pt, densità]
const DEVICES = [
  [440, 956, 3], // 16 Pro Max
  [402, 874, 3], // 16 Pro
  [430, 932, 3], // 14 Pro Max, 15 Plus/Pro Max, 16 Plus
  [393, 852, 3], // 14 Pro, 15, 15 Pro, 16
  [428, 926, 3], // 12/13 Pro Max, 14 Plus
  [390, 844, 3], // 12, 13, 14, 12/13 Pro
  [375, 812, 3], // X, XS, 11 Pro, 12/13 mini
  [414, 896, 3], // XS Max, 11 Pro Max
  [414, 896, 2], // XR, 11
  [375, 667, 2], // SE 2ª e 3ª generazione, 8
];
const THEMES = { light: "#f6f6f7", dark: "#0b0b0c" };
const ICON_PT = 100;

mkdirSync("public/splash", { recursive: true });
for (const [w, h, d] of DEVICES) {
  const icon = await sharp("public/icon-512.png").resize(ICON_PT * d, ICON_PT * d, { kernel: "lanczos3" }).toBuffer();
  for (const [theme, background] of Object.entries(THEMES)) {
    const file = `public/splash/${w}x${h}@${d}-${theme}.png`;
    await sharp({ create: { width: w * d, height: h * d, channels: 3, background } })
      .composite([{ input: icon, gravity: "center" }])
      .png({ compressionLevel: 9 })
      .toFile(file);
    console.log(file);
  }
}
