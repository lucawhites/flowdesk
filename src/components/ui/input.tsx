import * as React from "react";
import { cn } from "@/lib/utils";

// Tastiera del telefono: per i testi l'iniziale maiuscola automatica; per le email niente maiuscole
// né correttore. Chi usa il campo può sempre passare valori diversi.
function keyboardDefaults(type: string | undefined): React.InputHTMLAttributes<HTMLInputElement> {
  if (type === "email") return { autoCapitalize: "none", autoCorrect: "off", spellCheck: false, autoComplete: "email" };
  if (type === "password") return { autoCapitalize: "none", autoCorrect: "off", spellCheck: false };
  // autoComplete "off": senza, l'iPhone scambia i campi per un indirizzo e propone "casa…".
  if (!type || type === "text") return { autoCapitalize: "sentences", autoComplete: "off" };
  return {};
}

// Sugli schermi touch il campo non prende il cursore da solo (autoFocus): aprirebbe la tastiera
// appena compare la finestra, coprendola. Le finestre si aprono solo dopo un tocco, quindi qui
// window esiste già; nelle pagine (es. login) autoFocus non è un attributo HTML e non crea differenze.
const touchScreen = () => typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, autoFocus, ...props }, ref) => (
    <input
      ref={ref}
      {...keyboardDefaults(props.type)}
      autoFocus={autoFocus && !touchScreen()}
      className={cn(
        "flex h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      autoCapitalize="sentences"
      autoComplete="off"
      className={cn(
        "flex min-h-20 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-sm font-medium text-foreground", className)} {...props} />;
}
