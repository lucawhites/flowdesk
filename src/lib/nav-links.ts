// Voci del menù (barra laterale su computer, menù "Altro" sul telefono).
// Icone piene Fluent, le stesse della barra in basso.
import { CalendarIcon, DailyIcon, HomeIcon, KpiIcon, ObjectivesIcon, ProjectsIcon, SettingsIcon } from "@/components/tab-icons";

export const NAV_LINKS = [
  { href: "/home", label: "Home", icon: HomeIcon },
  { href: "/daily", label: "Daily", icon: DailyIcon },
  { href: "/calendario", label: "Calendario", icon: CalendarIcon },
  { href: "/obiettivi", label: "Obiettivi", icon: ObjectivesIcon },
  { href: "/progetti", label: "Progetti", icon: ProjectsIcon },
  { href: "/team", label: "KPI", icon: KpiIcon },
  { href: "/impostazioni", label: "Impostazioni", icon: SettingsIcon },
] as const;
