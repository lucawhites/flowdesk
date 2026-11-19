"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck2, CalendarDays, Home, Menu, Target } from "lucide-react";
import { cn } from "@/lib/utils";

// Barra in basso come nelle app iPhone, solo su telefono: le sezioni più usate a portata di pollice.
// "Altro" apre il menù laterale (Progetti, KPI e il resto).
export const OPEN_MENU_EVENT = "flowdesk:open-menu";

const TABS = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/daily", label: "Daily", icon: CalendarCheck2 },
  { href: "/obiettivi", label: "Obiettivi", icon: Target },
  { href: "/calendario", label: "Calendario", icon: CalendarDays },
] as const;

// Capsula sospesa in vetro come nell'app Musica di iPhone: molto trasparente, staccata dal bordo,
// icone del colore del testo; la sezione attiva ha icona arancio e una capsula di vetro grigio
// chiaro dietro icona e scritta (stili in globals.css, .tab-capsule).
const item =
  "my-1.5 flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[1.75rem] text-[0.6875rem] font-semibold outline-none transition-[transform,background-color] duration-150 active:scale-[0.94] focus-visible:ring-2 focus-visible:ring-ring";

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Sezioni"
      style={{ viewTransitionName: "app-tabbar" }}
      className="tab-capsule fixed inset-x-3 bottom-[max(0.75rem,calc(env(safe-area-inset-bottom)-0.375rem))] z-30 flex h-[4.25rem] rounded-[2.25rem] border px-1.5 md:hidden"
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
            <Icon className="h-[1.625rem] w-[1.625rem]" strokeWidth={2.2} />
            <span className="truncate">{label}</span>
          </Link>
        );
      })}
      <button
        type="button"
        onClick={() => window.dispatchEvent(new Event(OPEN_MENU_EVENT))}
        className={cn(item, "cursor-pointer text-foreground")}
      >
        <Menu className="h-[1.625rem] w-[1.625rem]" strokeWidth={2.2} />
        <span>Altro</span>
      </button>
    </nav>
  );
}
