"use client";

import { useEffect, useState, useTransition } from "react";
import { Bell, BellOff, LogOut, User } from "lucide-react";
import { toast } from "sonner";
import { disablePush, enablePush, pushStatus, type PushStatus } from "@/lib/push-client";
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

export function UserMenu({ name, email }: { name: string; email: string }) {
  const [pending, startTransition] = useTransition();
  const [push, setPush] = useState<PushStatus | null>(null);
  const [pushBusy, setPushBusy] = useState(false);
  useEffect(() => {
    pushStatus().then(setPush).catch(() => setPush("unsupported"));
  }, []);

  const togglePush = async () => {
    if (push === "needs-install") {
      toast.info("Per le notifiche aggiungi Flowdesk alla schermata Home: in Safari tocca Condividi › Aggiungi alla schermata Home.");
      return;
    }
    if (push === "denied") {
      toast.info("Le notifiche sono bloccate: riattivale da Impostazioni › Notifiche › Flowdesk.");
      return;
    }
    if (push === "unsupported") {
      toast.info("Questo browser non supporta le notifiche.");
      return;
    }
    setPushBusy(true);
    try {
      if (push === "on") {
        await disablePush();
        toast.success("Notifiche disattivate su questo dispositivo");
      } else {
        const result = await enablePush();
        if ("error" in result) toast.error(result.error);
        else toast.success("Notifiche attive: ti ho mandato una prova");
      }
    } catch {
      toast.error("Non è stato possibile cambiare le notifiche");
    } finally {
      setPush(await pushStatus().catch(() => "unsupported" as const));
      setPushBusy(false);
    }
  };

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
        <DropdownMenuItem disabled className="opacity-60">
          <User className="h-4 w-4" /> Profilo (presto)
        </DropdownMenuItem>
        {push && (
          <DropdownMenuItem
            disabled={pushBusy}
            onSelect={(event) => {
              event.preventDefault();
              togglePush();
            }}
          >
            {push === "on" ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
            {push === "on" ? "Disattiva notifiche" : "Attiva notifiche"}
          </DropdownMenuItem>
        )}
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
