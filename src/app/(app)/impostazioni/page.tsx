import type { ReactNode } from "react";
import { LogOut } from "lucide-react";
import { requireSessionUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { logout } from "@/app/(app)/actions";
import { DEFAULT_PALETTE, isPaletteId } from "@/lib/palettes";
import { PaletteChoice } from "@/components/settings/palette-choice";
import { PushToggle } from "@/components/settings/push-toggle";
import { BackgroundChoice } from "@/components/settings/background-choice";
import { ThemeChoice } from "@/components/theme-toggle";
import { TextSizeChoice } from "@/components/text-size-menu";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Impostazioni · Flowdesk" };

/** Impostazioni personali: aspetto (colori, tema, testo), notifiche e account. */
export default async function SettingsPage() {
  const sessionUser = await requireSessionUser();
  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { name: true, email: true, palette: true, team: { select: { name: true } } },
  });
  const palette = user && isPaletteId(user.palette) ? user.palette : DEFAULT_PALETTE;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Impostazioni</h1>
        <p className="mt-1 text-sm text-muted-foreground">Le tue preferenze. I colori valgono su tutti i tuoi dispositivi.</p>
      </div>

      <Section title="Colori" hint="La palette dell'app, in chiaro e in scuro. Vale per il tuo account.">
        <PaletteChoice initial={palette} />
      </Section>

      <Section title="Tema" hint="Automatico segue l'iPhone o il computer: così anche la barra in alto ha lo stesso colore dell'app.">
        <ThemeChoice />
      </Section>

      <Section title="Sfondo" hint="Vetro: colori sfumati dietro e schede trasparenti, come sul Mac. Vale su questo dispositivo.">
        <BackgroundChoice />
      </Section>

      <Section title="Dimensione del testo" hint="Vale su questo dispositivo.">
        <TextSizeChoice />
      </Section>

      <Section title="Notifiche">
        <PushToggle />
      </Section>

      <Section title="Account">
        <dl className="flex flex-col gap-2 text-sm">
          <Row label="Nome">{user?.name}</Row>
          <Row label="Email">{user?.email}</Row>
          <Row label="Workspace">{user?.team.name}</Row>
        </dl>
        <form action={logout} className="mt-4">
          <Button type="submit" variant="outline" className="text-danger">
            <LogOut className="h-4 w-4" /> Esci
          </Button>
        </form>
      </Section>
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <div>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[6rem_1fr] gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 truncate text-foreground">{children}</dd>
    </div>
  );
}
