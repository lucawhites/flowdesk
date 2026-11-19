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

// Capsula sospesa in vetro (stile app Apple recenti): staccata dal bordo, con ombra, icone del colore
// del testo e una pillola arancio chiaro dietro la sezione attiva. Più visibile della barra a filo.
const item =
  "group flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 text-[0.625rem] font-medium outline-none transition-transform duration-100 active:scale-[0.94]";
const pill = "flex h-7 w-12 items-center justify-center rounded-full transition-colors duration-150 group-focus-visible:ring-2 group-focus-visible:ring-ring";

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Sezioni"
      style={{ viewTransitionName: "app-tabbar" }}
      className="tab-capsule fixed inset-x-3 bottom-[max(0.75rem,calc(env(safe-area-inset-bottom)-0.375rem))] z-30 flex h-16 rounded-[2rem] border px-1 md:hidden"
    >
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(item, active ? "font-semibold text-accent" : "text-foreground/80")}
          >
            <span className={cn(pill, active && "bg-accent-soft")}>
              <Icon className="h-[1.375rem] w-[1.375rem]" strokeWidth={active ? 2.3 : 1.9} />
            </span>
            <span className="truncate">{label}</span>
          </Link>
        );
      })}
      <button
        type="button"
        onClick={() => window.dispatchEvent(new Event(OPEN_MENU_EVENT))}
        className={cn(item, "cursor-pointer text-foreground/80")}
      >
        <span className={pill}>
          <Menu className="h-[1.375rem] w-[1.375rem]" strokeWidth={1.9} />
        </span>
        <span>Altro</span>
      </button>
    </nav>
  );
}
