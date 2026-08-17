import { Home, LayoutDashboard, Users2 } from "lucide-react";

export const NAV_LINKS = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/dashboard", label: "Le mie task", icon: LayoutDashboard },
  { href: "/team", label: "Team", icon: Users2 },
] as const;
