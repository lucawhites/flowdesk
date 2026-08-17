import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { auth } from "@/auth";
import { SidebarNav } from "@/components/sidebar-nav";
import { UserMenu } from "@/components/user-menu";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-surface p-5 md:flex">
        <Link href="/dashboard" className="mb-8 flex items-center gap-2 px-1">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <CheckCircle2 className="h-4.5 w-4.5" />
          </span>
          <span className="text-base font-semibold tracking-tight">Flowdesk</span>
        </Link>
        <SidebarNav />
        <div className="mt-auto rounded-xl bg-surface-muted p-3">
          <p className="text-xs font-medium text-foreground">{session.user.teamName}</p>
          <p className="text-xs text-muted-foreground">Workspace del team</p>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-border bg-surface/80 px-4 py-3 backdrop-blur md:px-8">
          <Link href="/dashboard" className="flex items-center gap-2 md:hidden">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <CheckCircle2 className="h-4 w-4" />
            </span>
            <span className="text-sm font-semibold">Flowdesk</span>
          </Link>
          <nav className="flex items-center gap-1 md:hidden">
            <Link href="/dashboard" className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-surface-muted hover:text-foreground">
              Task
            </Link>
            <Link href="/team" className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-surface-muted hover:text-foreground">
              Team
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-tight text-foreground">{session.user.name}</p>
              <p className="text-xs leading-tight text-muted-foreground">{session.user.email}</p>
            </div>
            <UserMenu name={session.user.name ?? session.user.email ?? "?"} email={session.user.email ?? ""} />
          </div>
        </header>

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
