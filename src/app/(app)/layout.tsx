import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppLogo } from "@/components/app-logo";
import { auth } from "@/auth";
import { SidebarNav } from "@/components/sidebar-nav";
import { MobileNav } from "@/components/mobile-nav";
import { UserMenu } from "@/components/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { TextSizeMenu } from "@/components/text-size-menu";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-surface p-5 md:flex">
        <Link href="/home" className="mb-8 flex items-center gap-2 px-1">
          <AppLogo className="h-8 w-8" />
          <span className="text-base font-semibold tracking-tight text-foreground">Flowdesk</span>
        </Link>
        <SidebarNav />
        <div className="mt-auto border-t border-border pt-4">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Workspace</p>
          <p className="mt-0.5 text-sm font-medium text-foreground">{session.user.teamName}</p>
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-surface/80 px-4 py-3 backdrop-blur md:px-8">
          <div className="flex items-center gap-2 md:hidden">
            <MobileNav teamName={session.user.teamName} />
            <Link href="/home" className="flex items-center gap-2">
              <AppLogo className="h-7 w-7" />
              <span className="text-sm font-semibold">Flowdesk</span>
            </Link>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <TextSizeMenu />
            <ThemeToggle />
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-tight text-foreground">{session.user.name}</p>
              <p className="text-xs leading-tight text-muted-foreground">{session.user.email}</p>
            </div>
            <UserMenu name={session.user.name ?? session.user.email ?? "?"} email={session.user.email ?? ""} />
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 pt-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
