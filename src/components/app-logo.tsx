import { useId } from "react";

// Marchio Flowdesk: lo stesso disegno dell'icona dell'app (scripts/make-icons.mjs, variante "E1":
// monogramma F in vetro arancio su grafite). Colori fissi in entrambi i temi; il bordo sottile
// lo stacca dal fondo scuro.
// Gli id dei gradienti sono unici per ogni logo: due loghi nella stessa pagina (uno nascosto) non si disturbano.
export function AppLogo({ className = "h-8 w-8" }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  const ref = (name: string) => `url(#${id}-${name})`;

  // Pillola di vetro: forma piena, bordo di luce e riflesso in alto (solo sui bracci).
  const pills = [
    { x: 31, y: 22, w: 15, h: 57, fill: ref("orangeV"), opacity: 0.92, shine: false },
    { x: 31, y: 22, w: 40, h: 15, fill: ref("orange"), opacity: 0.88, shine: true },
    { x: 31, y: 45, w: 30, h: 14, fill: ref("orange"), opacity: 0.85, shine: true },
  ];

  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" className={`${className} shrink-0 rounded-[22%] ring-1 ring-border`}>
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3d3d44" />
          <stop offset="1" stopColor="#0f0f11" />
        </linearGradient>
        <linearGradient id={`${id}-orange`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffb08a" />
          <stop offset="1" stopColor="#e2501c" />
        </linearGradient>
        <linearGradient id={`${id}-orangeV`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffb894" />
          <stop offset="1" stopColor="#e2501c" />
        </linearGradient>
        <linearGradient id={`${id}-sheen`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.9" />
          <stop offset="0.45" stopColor="#fff" stopOpacity="0.1" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}-edge`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.6" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.04" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.25" />
        </linearGradient>
        <filter id={`${id}-glow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
        <filter id={`${id}-soft`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.2" />
        </filter>
      </defs>
      <rect width="100" height="100" fill={ref("bg")} />
      <ellipse cx="51" cy="54" rx="22" ry="24" fill="#f27a4c" opacity="0.42" filter={ref("glow")} />
      <g transform="translate(2 0)">
        {pills.map((p, i) => (
          <rect key={`f${i}`} x={p.x} y={p.y} width={p.w} height={p.h} rx={Math.min(p.w, p.h) / 2} fill={p.fill} opacity={p.opacity} />
        ))}
        {pills.map((p, i) => (
          <rect
            key={`r${i}`}
            x={p.x + 0.4}
            y={p.y + 0.4}
            width={p.w - 0.8}
            height={p.h - 0.8}
            rx={Math.min(p.w, p.h) / 2 - 0.4}
            fill="none"
            stroke={ref("edge")}
            strokeWidth="0.8"
          />
        ))}
        {pills
          .filter((p) => p.shine)
          .map((p, i) => {
            const r = Math.min(p.w, p.h) / 2;
            return (
              <path
                key={`h${i}`}
                d={`M${p.x + r} ${p.y + 1.6}h${p.w - 2 * r}`}
                stroke="#fff"
                strokeWidth="1.6"
                strokeLinecap="round"
                opacity="0.7"
                filter={ref("soft")}
              />
            );
          })}
      </g>
      <rect width="100" height="100" fill={ref("sheen")} opacity="0.16" />
    </svg>
  );
}
