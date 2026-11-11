import { Home, ListChecks, Users2 } from "lucide-react";

export const NAV_LINKS = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/tasks", label: "Task", icon: ListChecks },
  { href: "/team", label: "Team", icon: Users2 },
] as const;
