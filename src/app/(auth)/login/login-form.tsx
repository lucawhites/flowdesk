"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { login } from "../actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email aziendale</Label>
        <Input id="email" name="email" type="email" placeholder="tu@azienda.com" required autoFocus />
        {state?.errors?.email && <p className="text-xs text-danger">{state.errors.email[0]}</p>}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" placeholder="••••••••" required />
        {state?.errors?.password && <p className="text-xs text-danger">{state.errors.password[0]}</p>}
      </div>
      {state?.message && (
        <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{state.message}</p>
      )}
      <Button type="submit" disabled={pending} className="mt-2 w-full">
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        Accedi
      </Button>
    </form>
  );
}
