import { useId } from "react";

// Marchio Flowdesk: lo stesso disegno dell'icona dell'app (scripts/make-icons.mjs, variante "1d-E":
// F in vetro arancio pieno, un po' più grande, su grigio nebbia). Colori fissi in entrambi i temi; il bordo
// sottile lo stacca dallo sfondo.
// Gli id dei gradienti sono unici per ogni logo: due loghi nella stessa pagina (uno nascosto) non si disturbano.
export function AppLogo({ className = "h-8 w-8" }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  const ref = (name: string) => `url(#${id}-${name})`;

  // Asta, braccio alto, braccio centrale (x 33: centratura ottica, come nell'icona).
  const pills = [
    { x: 33, y: 22, w: 15, h: 57, shine: false },
    { x: 33, y: 22, w: 40, h: 15, shine: true },
    { x: 33, y: 45, w: 30, h: 14, shine: true },
  ];
  const rx = (p: { w: number; h: number }) => Math.min(p.w, p.h) / 2;

  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" className={`${className} shrink-0 rounded-[22%] ring-1 ring-border`}>
      <defs>
        <radialGradient id={`${id}-bg`} cx="0.3" cy="0.2" r="0.95">
          <stop offset="0" stopColor="#eeeef0" />
          <stop offset="0.6" stopColor="#dcdde1" />
          <stop offset="1" stopColor="#c6c8ce" />
        </radialGradient>
        <linearGradient id={`${id}-orangeV`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff9a6a" />
          <stop offset="1" stopColor="#d8461a" />
        </linearGradient>
        <linearGradient id={`${id}-sheen`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.9" />
          <stop offset="0.45" stopColor="#fff" stopOpacity="0.1" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}-edge`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.7" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.05" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.3" />
        </linearGradient>
        <filter id={`${id}-shadow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.2" />
        </filter>
        <filter id={`${id}-soft`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.2" />
        </filter>
      </defs>
      <rect width="100" height="100" fill={ref("bg")} />
      <g transform="translate(52 50) scale(1.1) translate(-53 -50.5)">
      <g opacity="0.28" filter={ref("shadow")} transform="translate(0 1.6)">
        {pills.map((p, i) => (
          <rect key={`s${i}`} x={p.x} y={p.y} width={p.w} height={p.h} rx={rx(p)} fill="#7a240a" />
        ))}
      </g>
      {pills.map((p, i) => (
        <rect key={`f${i}`} x={p.x} y={p.y} width={p.w} height={p.h} rx={rx(p)} fill={ref("orangeV")} />
      ))}
      {pills.map((p, i) => (
        <rect
          key={`r${i}`}
          x={p.x + 0.4}
          y={p.y + 0.4}
          width={p.w - 0.8}
          height={p.h - 0.8}
          rx={rx(p) - 0.4}
          fill="none"
          stroke={ref("edge")}
          strokeWidth="0.9"
        />
      ))}
      {pills
        .filter((p) => p.shine)
        .map((p, i) => (
          <path
            key={`h${i}`}
            d={`M${p.x + rx(p)} ${p.y + 1.7}h${p.w - 2 * rx(p)}`}
            stroke="#fff"
            strokeWidth="1.7"
            strokeLinecap="round"
            opacity="0.85"
            filter={ref("soft")}
          />
        ))}
      </g>
      <rect width="100" height="100" fill={ref("sheen")} opacity="0.24" />
    </svg>
  );
}
