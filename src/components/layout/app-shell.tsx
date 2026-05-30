"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Settings, LogOut } from "lucide-react";
import { NAV } from "./nav";
import { ThemeToggle } from "./theme-toggle";
import { BottomNav } from "./bottom-nav";
import { NewTaskButton } from "@/components/tasks/new-task-button";
import { cn } from "@/lib/cn";

const TITLES: Record<string, string> = {
  "/hoje": "Foco de Hoje",
  "/semana": "Semana",
  "/mes": "Mês",
  "/quadro": "Quadro",
  "/config": "Configurações",
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const title = TITLES[pathname] ?? "Kanban SHU";

  return (
    <div className="flex min-h-dvh">
      {/* Sidebar — só no desktop */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card p-4 md:flex">
        <div className="mb-6 px-2">
          <span className="font-heading text-lg font-bold">Kanban SHU</span>
          <p className="text-xs text-muted-foreground">Sua Hora Unha</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <Link
          href="/config"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Settings className="h-5 w-5" />
          Configurações
        </Link>
      </aside>

      {/* Coluna principal */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur">
          <h1 className="font-heading text-base font-semibold">{title}</h1>
          <div className="flex items-center gap-1.5">
            <NewTaskButton />
            <ThemeToggle />
            <Link
              href="/config"
              aria-label="Configurações"
              className="grid h-10 w-10 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
            >
              <Settings className="h-5 w-5" />
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              aria-label="Sair"
              className="grid h-10 w-10 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* pb-20 reserva espaço para o menu inferior no mobile */}
        <main className="flex-1 p-4 pb-24 md:pb-6">{children}</main>
      </div>

      <BottomNav />
    </div>
  );
}
