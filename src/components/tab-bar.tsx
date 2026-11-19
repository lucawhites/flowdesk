"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
// Icone piene (Fluent), come i simboli delle app iPhone: in arancio sulla sezione attiva si notano
// molto più delle icone a contorno usate nel resto dell'app.
import { CalendarIcon, DailyIcon, HomeIcon, MoreIcon, ObjectivesIcon } from "@/components/tab-icons";
import { cn } from "@/lib/utils";

// Barra in basso come nelle app iPhone, solo su telefono: le sezioni più usate a portata di pollice.
// "Altro" apre il menù laterale (Progetti, KPI e il resto).
export const OPEN_MENU_EVENT = "flowdesk:open-menu";

const TABS = [
  { href: "/home", label: "Home", icon: HomeIcon },
  { href: "/daily", label: "Daily", icon: DailyIcon },
  { href: "/obiettivi", label: "Obiettivi", icon: ObjectivesIcon },
  { href: "/calendario", label: "Calendario", icon: CalendarIcon },
] as const;
const SLOTS = TABS.length + 1; // + "Altro"
const MOVE_THRESHOLD = 8; // px: oltre, il tocco diventa un trascinamento della lente

// Capsula sospesa in vetro come nell'app Musica di iPhone (stili in globals.css, .tab-capsule).
// La sezione attiva ha dietro una capsula di vetro che SCIVOLA da una voce all'altra con effetto
// molla. Tenendo premuto la capsula si gonfia in una "lente" che segue il dito: l'icona sotto
// si ingrandisce e si colora, e al rilascio si apre la sezione su cui ci si è fermati.
// Si muovono solo transform e opacità: resta fluido anche sul telefono.
const item =
  "relative z-10 my-1.5 flex min-w-0 flex-1 flex-col items-center justify-center gap-1 text-[0.65rem] font-semibold tracking-[-0.01em] outline-none focus-visible:rounded-[1.75rem] focus-visible:ring-2 focus-visible:ring-ring";

type Press = { startX: number; moved: boolean; pointerId: number };

export function TabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const trackRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);

  // iPhone: col dito sulla barra niente gesti di sistema (selezione del testo, menù Copia,
  // anteprima del link). Il tocco semplice e il trascinamento li gestiscono i pointer qui sotto;
  // il "click" del dito non arriva più, quindi la navigazione al tocco parte da onPointerUp.
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const block = (e: TouchEvent) => e.preventDefault();
    nav.addEventListener("touchstart", block, { passive: false });
    return () => nav.removeEventListener("touchstart", block);
  }, []);
  const press = useRef<Press | null>(null);
  const suppressClick = useRef(false);

  const routeIndex = TABS.findIndex(({ href }) => pathname === href || pathname.startsWith(`${href}/`));
  // Sezione scelta col dito, mostrata subito mentre la pagina nuova arriva.
  const [picked, setPicked] = useState<{ index: number; from: string } | null>(null);
  const selected = picked && picked.from === pathname ? picked.index : routeIndex;

  // Lente: aperta mentre il dito è sulla barra; x = centro della lente in px dentro la barra.
  const [lens, setLens] = useState<{ x: number; hover: number } | null>(null);

  const geometry = () => {
    const rect = trackRef.current!.getBoundingClientRect();
    return { left: rect.left, width: rect.width, slot: rect.width / SLOTS };
  };
  const slotAt = (clientX: number) => {
    const { left, slot } = geometry();
    return Math.max(0, Math.min(SLOTS - 1, Math.floor((clientX - left) / slot)));
  };
  const lensAt = (clientX: number) => {
    const { left, width, slot } = geometry();
    const x = Math.max(slot / 2, Math.min(width - slot / 2, clientX - left));
    return { x, hover: slotAt(clientX) };
  };

  const go = (index: number) => {
    if (index === TABS.length) {
      window.dispatchEvent(new Event(OPEN_MENU_EVENT));
      return;
    }
    setPicked({ index, from: pathname });
    if (index !== routeIndex) router.push(TABS[index].href);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    // Niente selezione del testo (che su iPhone col tocco lungo apre il menù Copia).
    window.getSelection()?.removeAllRanges();
    press.current = { startX: e.clientX, moved: false, pointerId: e.pointerId };
    setLens(lensAt(e.clientX));
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const p = press.current;
    if (!p || p.pointerId !== e.pointerId) return;
    if (!p.moved && Math.abs(e.clientX - p.startX) > MOVE_THRESHOLD) {
      p.moved = true;
      // Il dito resta "agganciato" alla barra anche se esce di poco dal bordo.
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {
        // Puntatore non più attivo: si continua senza aggancio.
      }
    }
    setLens(lensAt(e.clientX));
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const p = press.current;
    press.current = null;
    setLens(null);
    if (!p || p.pointerId !== e.pointerId) return;
    if (p.moved) {
      // Trascinamento: apre la sezione sotto il dito; il click che segue va ignorato.
      suppressClick.current = true;
      window.setTimeout(() => (suppressClick.current = false), 400);
      go(slotAt(e.clientX));
    } else if (e.pointerType === "touch") {
      // Tocco semplice col dito (il click è bloccato insieme ai gesti di sistema).
      go(slotAt(e.clientX));
    }
  };
  const onPointerCancel = () => {
    press.current = null;
    setLens(null);
  };

  // Tocco semplice: lo gestisce il link (o il pulsante "Altro"); qui solo l'anticipo della capsula.
  const onTap = (index: number) => (e: React.MouseEvent) => {
    if (suppressClick.current) {
      e.preventDefault();
      return;
    }
    if (index === TABS.length) {
      window.dispatchEvent(new Event(OPEN_MENU_EVENT));
      return;
    }
    setPicked({ index, from: pathname });
  };

  // Su pagine fuori dalla barra (es. Progetti dal menù) la capsula sparisce con dissolvenza.
  const pillIndex = selected >= 0 ? selected : -1;
  const pillVisible = lens !== null || pillIndex >= 0;
  const pillStyle: React.CSSProperties = lens
    ? { transform: `translateX(calc(${lens.x}px - 50%)) scale(1.16, 1.32)` }
    : { transform: `translateX(${Math.max(pillIndex, 0) * 100}%) scale(1)` };

  return (
    <nav
      ref={navRef}
      aria-label="Sezioni"
      style={{ viewTransitionName: "app-tabbar", touchAction: "none" }}
      className="tab-capsule fixed inset-x-2 bottom-[max(0.75rem,calc(env(safe-area-inset-bottom)-0.375rem))] z-30 h-[4.25rem] rounded-[2.25rem] border px-1 select-none md:hidden"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div ref={trackRef} className="relative flex h-full">
        {/* Capsula della sezione attiva / lente di vetro: larga quanto una voce. */}
        <span
          aria-hidden
          className={cn(
            "tab-lens pointer-events-none absolute inset-y-1.5 left-0 w-1/5 rounded-[1.75rem]",
            lens ? "tab-lens-pressed" : "tab-lens-rest",
            pillVisible ? "opacity-100" : "opacity-0"
          )}
          style={pillStyle}
        />
        {TABS.map(({ href, label, icon: Icon }, index) => {
          const active = selected === index;
          const hovered = lens?.hover === index;
          return (
            <Link
              key={href}
              href={href}
              aria-current={routeIndex === index ? "page" : undefined}
              onClick={onTap(index)}
              draggable={false}
              className={cn(item, active || hovered ? "text-accent" : "text-foreground")}
            >
              <Icon className={cn("tab-icon h-7 w-7", hovered && "tab-icon-lifted")} />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={onTap(TABS.length)}
          className={cn(item, "cursor-pointer", lens?.hover === TABS.length ? "text-accent" : "text-foreground")}
        >
          <MoreIcon className={cn("tab-icon h-7 w-7", lens?.hover === TABS.length && "tab-icon-lifted")} />
          <span>Altro</span>
        </button>
      </div>
    </nav>
  );
}
