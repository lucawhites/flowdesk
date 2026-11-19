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

const item =
  "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 pt-1.5 text-[0.625rem] font-medium outline-none transition-[color,transform] duration-100 active:scale-[0.94] focus-visible:text-accent";

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Sezioni"
      style={{ viewTransitionName: "app-tabbar" }}
      className="glass-bar fixed inset-x-0 bottom-0 z-30 flex border-t border-border/70 pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <div className="flex h-14 w-full">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(item, active ? "text-accent" : "text-muted-foreground")}
            >
              <Icon className="h-[1.375rem] w-[1.375rem]" strokeWidth={active ? 2.3 : 1.9} />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event(OPEN_MENU_EVENT))}
          className={cn(item, "cursor-pointer text-muted-foreground")}
        >
          <Menu className="h-[1.375rem] w-[1.375rem]" strokeWidth={1.9} />
          <span>Altro</span>
        </button>
      </div>
    </nav>
  );
}
