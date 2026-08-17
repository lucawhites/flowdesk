"use client";

import { useActionState } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { register } from "../actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(register, undefined);

  if (state?.info) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-success-soft text-success">
          <MailCheck className="h-6 w-6" />
        </span>
        <p className="text-sm text-foreground">{state.info}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Nome e cognome</Label>
        <Input id="name" name="name" placeholder="Mario Rossi" required autoFocus />
        {state?.errors?.name && <p className="text-xs text-danger">{state.errors.name[0]}</p>}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="company">Nome azienda / team</Label>
        <Input id="company" name="company" placeholder="Acme Srl" required />
        {state?.errors?.company && <p className="text-xs text-danger">{state.errors.company[0]}</p>}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email aziendale</Label>
        <Input id="email" name="email" type="email" placeholder="tu@azienda.com" required />
        {state?.errors?.email && <p className="text-xs text-danger">{state.errors.email[0]}</p>}
        <p className="text-xs text-muted-foreground">
          I colleghi con la stessa email aziendale (@azienda.com) entreranno automaticamente nello stesso team.
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" placeholder="Almeno 8 caratteri" required />
        {state?.errors?.password && <p className="text-xs text-danger">{state.errors.password[0]}</p>}
      </div>
      {state?.message && (
        <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{state.message}</p>
      )}
      <Button type="submit" disabled={pending} className="mt-2 w-full">
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        Crea account
      </Button>
    </form>
  );
}
