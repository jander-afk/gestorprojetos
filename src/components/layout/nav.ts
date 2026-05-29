import {
  Sun,
  CalendarDays,
  CalendarRange,
  Columns3,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };

// Itens das visões — usados no menu inferior (mobile) e na sidebar (desktop).
export const NAV: NavItem[] = [
  { href: "/hoje", label: "Hoje", icon: Sun },
  { href: "/semana", label: "Semana", icon: CalendarDays },
  { href: "/mes", label: "Mês", icon: CalendarRange },
  { href: "/quadro", label: "Quadro", icon: Columns3 },
];
