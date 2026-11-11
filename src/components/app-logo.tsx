// Marchio Flowdesk: lo stesso disegno dell'icona dell'app (scripts/make-icons.mjs).
// Colori fissi in entrambi i temi; il bordo sottile lo stacca dal fondo scuro.
export function AppLogo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" className={`${className} shrink-0 rounded-[22%] ring-1 ring-border`}>
      <rect width="100" height="100" fill="#141413" />
      <g transform="translate(50 50) scale(1.25) translate(-50 -50)">
      <circle cx="50" cy="50" r="26" fill="none" stroke="#33322d" strokeWidth="9" />
      <circle
        cx="50"
        cy="50"
        r="26"
        fill="none"
        stroke="#d97757"
        strokeWidth="9"
        strokeLinecap="round"
        strokeDasharray="114 164"
        transform="rotate(-90 50 50)"
      />
      <path d="M40 51l7 7 13-15" fill="none" stroke="#f4f2eb" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}
