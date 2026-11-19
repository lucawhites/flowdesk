"use client";

import type { ReactNode } from "react";
import { MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function ItemMenu({ children }: { children: ReactNode }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Azioni"
        className="btn-press cursor-pointer rounded-full p-1.5 text-muted-foreground outline-none hover:bg-foreground/5 hover:text-foreground active:bg-foreground/10 focus-visible:ring-2 focus-visible:ring-ring"
      >
        <MoreHorizontal className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">{children}</DropdownMenuContent>
    </DropdownMenu>
  );
}
