// Schermate di avvio per l'app installata su iPhone (generate da scripts/make-splash.mjs).
// Ogni iPhone sceglie quella con le sue misure e il tema chiaro/scuro del sistema.
const DEVICES: [number, number, number][] = [
  [440, 956, 3],
  [402, 874, 3],
  [430, 932, 3],
  [393, 852, 3],
  [428, 926, 3],
  [390, 844, 3],
  [375, 812, 3],
  [414, 896, 3],
  [414, 896, 2],
  [375, 667, 2],
];

export const SPLASH_SCREENS = DEVICES.flatMap(([w, h, d]) =>
  (["light", "dark"] as const).map((theme) => ({
    url: `/splash/${w}x${h}@${d}-${theme}.png`,
    media: `(device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${d}) and (orientation: portrait) and (prefers-color-scheme: ${theme})`,
  }))
);
