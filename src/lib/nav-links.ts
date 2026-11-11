import { CalendarCheck2, FolderKanban, Home, Target, Users2 } from "lucide-react";

export const NAV_LINKS = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/daily", label: "Daily", icon: CalendarCheck2 },
  { href: "/obiettivi", label: "Obiettivi", icon: Target },
  { href: "/progetti", label: "Progetti", icon: FolderKanban },
  { href: "/team", label: "Team", icon: Users2 },
] as const;
