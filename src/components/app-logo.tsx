import { useId } from "react";

// Marchio Flowdesk: lo stesso disegno dell'icona dell'app (scripts/make-icons.mjs, variante "vetro scuro").
// Colori fissi in entrambi i temi; il bordo sottile lo stacca dal fondo scuro.
// Gli id dei gradienti sono unici per ogni logo: due loghi nella stessa pagina (uno nascosto) non si disturbano.
export function AppLogo({ className = "h-8 w-8" }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  const ref = (name: string) => `url(#${id}-${name})`;
  const arc = { cx: 50, cy: 50, r: 26, fill: "none", strokeLinecap: "round", strokeDasharray: "114 164", transform: "rotate(-90 50 50)" } as const;
  const check = { d: "M40 51l7 7 13-15", fill: "none", strokeWidth: 6, strokeLinecap: "round", strokeLinejoin: "round" } as const;

  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" className={`${className} shrink-0 rounded-[22%] ring-1 ring-border`}>
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#34322d" />
          <stop offset="1" stopColor="#0d0d0c" />
        </linearGradient>
        <linearGradient id={`${id}-orange`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f09a77" />
          <stop offset="1" stopColor="#c4613f" />
        </linearGradient>
        <linearGradient id={`${id}-sheen`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="1" />
          <stop offset="0.45" stopColor="#fff" stopOpacity="0.15" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <filter id={`${id}-glow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <filter id={`${id}-soft`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.6" />
        </filter>
      </defs>
      <rect width="100" height="100" fill={ref("bg")} />
      <g transform="translate(50 50) scale(1.25) translate(-50 -50)">
        <circle cx="50" cy="50" r="26" fill="none" stroke="#fff" strokeWidth="9" opacity="0.07" />
        <g filter={ref("glow")} opacity="0.7">
          <circle {...arc} stroke="#d97757" strokeWidth="12" />
        </g>
        <circle {...arc} stroke={ref("orange")} strokeWidth="9" />
        <g transform="translate(-1.6 -1.6)" opacity="0.55" filter={ref("soft")}>
          <circle {...arc} stroke="#fff" strokeWidth="2.2" />
        </g>
        <path {...check} stroke="#f7f3ea" />
      </g>
      <rect width="100" height="100" fill={ref("sheen")} opacity="0.2" />
    </svg>
  );
}
