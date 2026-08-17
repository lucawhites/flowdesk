import type { ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 50% at 15% 10%, var(--primary-soft), transparent), radial-gradient(50% 40% at 85% 90%, var(--primary-soft), transparent)",
        }}
      />
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <CheckCircle2 className="h-5 w-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight">Flowdesk</span>
        </div>
        {children}
      </div>
    </div>
  );
}
