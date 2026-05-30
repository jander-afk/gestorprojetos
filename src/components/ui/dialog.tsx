"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

// Modal robusto: a SOBREPOSIÇÃO inteira rola (assim o topo/Título e o botão
// Salvar são sempre alcançáveis, mesmo em telas baixas) e o cabeçalho fica
// fixo (sticky) no topo do card. Trava o scroll do body enquanto aberto.
export function Dialog({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-black/40"
      onClick={onClose}
    >
      <div className="flex min-h-full items-end justify-center sm:items-center sm:p-4">
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg rounded-t-2xl bg-card shadow-xl sm:rounded-2xl"
        >
          <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-2xl border-b border-border bg-card px-4 py-3">
            <h2 className="font-heading font-semibold">{title}</h2>
            <button
              onClick={onClose}
              aria-label="Fechar"
              className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="p-4">{children}</div>
        </div>
      </div>
    </div>
  );
}
