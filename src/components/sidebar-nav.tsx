"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_LINKS } from "@/lib/nav-links";
import { cn } from "@/lib/utils";

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {NAV_LINKS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-100 active:scale-[0.97]",
              active
                ? "bg-surface-muted font-semibold text-foreground before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-accent"
                : "font-medium text-muted-foreground hover:bg-surface-muted hover:text-foreground active:bg-surface-muted"
            )}
          >
            <Icon className={cn("h-4 w-4", active && "text-accent")} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
