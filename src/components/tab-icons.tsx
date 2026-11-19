// Icone piene della barra in basso: Fluent UI System Icons (Microsoft, licenza MIT), versione "filled" 24px.
// Forme morbide e arrotondate, vicine ai simboli di iPhone; prendono il colore del testo (currentColor).
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function make(d: string) {
  return function Icon(props: IconProps) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
        <path d={d} />
      </svg>
    );
  };
}

export const HomeIcon = make(
  "M13.45 2.53c-.84-.7-2.06-.7-2.9 0L3.8 8.23c-.5.43-.8 1.05-.8 1.72v9.3c0 .97.78 1.75 1.75 1.75h3c.97 0 1.75-.78 1.75-1.75v-4c0-.68.54-1.23 1.22-1.25h2.56c.68.02 1.22.57 1.22 1.25v4c0 .97.78 1.75 1.75 1.75h3c.97 0 1.75-.78 1.75-1.75v-9.3c0-.67-.3-1.3-.8-1.72z"
);
export const DailyIcon = make(
  "M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20m3.22 6.97-4.47 4.47-1.97-1.97a.75.75 0 0 0-1.06 1.06l2.5 2.5c.3.3.77.3 1.06 0l5-5a.75.75 0 1 0-1.06-1.06"
);
export const ObjectivesIcon = make(
  "M21.78 6.78a.75.75 0 0 0-.53-1.28H18.5V2.75a.75.75 0 0 0-1.28-.53l-2.5 2.5a.8.8 0 0 0-.22.53v2.84l-1.98 1.98a2 2 0 1 0 1.41 1.41l1.98-1.98h2.84q.31 0 .53-.22zM12 2q1.81 0 3.42.6l-1.4 1.41-.18.2A8.02 8.02 0 0 0 4 12a8 8 0 1 0 15.79-1.84l.2-.17 1.4-1.41q.6 1.6.61 3.42A10 10 0 1 1 12 2m0 4q.78 0 1.5.19v1.48l-.41.42-.05.05a4 4 0 1 0 2.82 2.82l.05-.05.42-.41h1.48A6.01 6.01 0 1 1 12 6"
);
export const CalendarIcon = make(
  "M21 8.5v9.25c0 1.8-1.46 3.25-3.25 3.25H6.25A3.25 3.25 0 0 1 3 17.75V8.5zM7.25 15a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5M12 15a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5m-4.75-4.5a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5m4.75 0a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5m4.75 0a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5m1-7.5C19.55 3 21 4.46 21 6.25V7H3v-.75C3 4.45 4.46 3 6.25 3z"
);
export const MoreIcon = make(
  "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20M8.25 12a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0m5 0a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0m5 0a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0"
);
