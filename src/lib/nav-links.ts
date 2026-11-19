import { BarChart3, CalendarCheck2, CalendarDays, FolderKanban, Home, Settings, Target } from "lucide-react";

export const NAV_LINKS = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/daily", label: "Daily", icon: CalendarCheck2 },
  { href: "/calendario", label: "Calendario", icon: CalendarDays },
  { href: "/obiettivi", label: "Obiettivi", icon: Target },
  { href: "/progetti", label: "Progetti", icon: FolderKanban },
  { href: "/team", label: "KPI", icon: BarChart3 },
  { href: "/impostazioni", label: "Impostazioni", icon: Settings },
] as const;
