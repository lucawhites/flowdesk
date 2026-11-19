"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Settings } from "lucide-react";
import { logout } from "@/app/(app)/actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/lib/utils";

/** Menù dell'avatar: impostazioni (colori, tema, notifiche, account) e uscita. */
export function UserMenu({ name, email }: { name: string; email: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer">
        <Avatar>
          <AvatarFallback>{initials(name)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-foreground">{name}</span>
          <span className="truncate text-xs font-normal text-muted-foreground">{email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.push("/impostazioni")}>
          <Settings className="h-4 w-4" /> Impostazioni
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={pending}
          onSelect={(event) => {
            event.preventDefault();
            startTransition(() => {
              logout();
            });
          }}
          className="text-danger data-[highlighted]:bg-danger-soft"
        >
          <LogOut className="h-4 w-4" /> Esci
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
