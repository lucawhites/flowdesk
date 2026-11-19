"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
// Icone piene (Fluent), come i simboli delle app iPhone: in arancio sulla sezione attiva si notano
// molto più delle icone a contorno usate nel resto dell'app.
import { CalendarIcon, DailyIcon, HomeIcon, MoreIcon, ObjectivesIcon } from "@/components/tab-icons";
import { cn } from "@/lib/utils";

// Barra in basso come nelle app iPhone, solo su telefono: le sezioni più usate a portata di pollice.
// "Altro" apre il menù laterale (Progetti, KPI e il resto).
export const OPEN_MENU_EVENT = "flowdesk:open-menu";

const TABS = [
  { href: "/home", label: "Home", icon: HomeIcon },
  { href: "/daily", label: "Daily", icon: DailyIcon },
  { href: "/obiettivi", label: "Obiettivi", icon: ObjectivesIcon },
  { href: "/calendario", label: "Calendario", icon: CalendarIcon },
] as const;

// Capsula sospesa in vetro come nell'app Musica di iPhone: molto trasparente, staccata dal bordo,
// icone del colore del testo; la sezione attiva ha icona arancio e una capsula di vetro grigio
// chiaro dietro icona e scritta (stili in globals.css, .tab-capsule).
const item =
  "my-1.5 flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[1.75rem] text-[0.65rem] font-semibold tracking-[-0.01em] outline-none transition-[transform,background-color] duration-150 active:scale-[0.94] focus-visible:ring-2 focus-visible:ring-ring";

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Sezioni"
      style={{ viewTransitionName: "app-tabbar" }}
      className="tab-capsule fixed inset-x-2 bottom-[max(0.75rem,calc(env(safe-area-inset-bottom)-0.375rem))] z-30 flex h-[4.25rem] rounded-[2.25rem] border px-1 md:hidden"
    >
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(item, active ? "text-accent" : "text-foreground")}
          >
            <Icon className="h-7 w-7" />
            <span className="truncate">{label}</span>
          </Link>
        );
      })}
      <button
        type="button"
        onClick={() => window.dispatchEvent(new Event(OPEN_MENU_EVENT))}
        className={cn(item, "cursor-pointer text-foreground")}
      >
        <MoreIcon className="h-7 w-7" />
        <span>Altro</span>
      </button>
    </nav>
  );
}
