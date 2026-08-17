"use client";

import { useActionState, useRef } from "react";
import { Loader2 } from "lucide-react";
import { login, resendVerificationEmail } from "../actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, undefined);
  const [resendState, resendAction, resendPending] = useActionState(resendVerificationEmail, undefined);
  const emailRef = useRef<HTMLInputElement>(null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email aziendale</Label>
        <Input ref={emailRef} id="email" name="email" type="email" placeholder="tu@azienda.com" required autoFocus />
        {state?.errors?.email && <p className="text-xs text-danger">{state.errors.email[0]}</p>}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" placeholder="••••••••" required />
        {state?.errors?.password && <p className="text-xs text-danger">{state.errors.password[0]}</p>}
      </div>
      {state?.message && (
        <div className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
          <p>{state.message}</p>
          {state.code === "email_not_verified" && !resendState?.info && (
            <button
              type="button"
              disabled={resendPending}
              className="mt-1 font-medium underline underline-offset-2 disabled:opacity-60"
              onClick={() => {
                const formData = new FormData();
                formData.set("email", emailRef.current?.value ?? "");
                resendAction(formData);
              }}
            >
              Invia di nuovo il link di verifica
            </button>
          )}
        </div>
      )}
      {resendState?.info && (
        <p className="rounded-lg bg-success-soft px-3 py-2 text-sm text-success">{resendState.info}</p>
      )}
      {resendState?.message && (
        <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{resendState.message}</p>
      )}
      <Button type="submit" disabled={pending} className="mt-2 w-full">
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        Accedi
      </Button>
    </form>
  );
}
