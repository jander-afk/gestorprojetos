"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import type { TaskDTO } from "@/lib/types";

// Coluna "Foco de Hoje" (visão Diária).
export function useFocusToday() {
  return useQuery({
    queryKey: ["focus-today"],
    queryFn: () => apiGet<TaskDTO[]>("/api/tasks?view=today"),
  });
}

// Tarefas com prazo dentro de um intervalo (visões Diária/Semanal/Mensal).
export function useTasksRange(startISO: string, endISO: string) {
  return useQuery({
    queryKey: ["range", startISO, endISO],
    queryFn: () =>
      apiGet<TaskDTO[]>(
        `/api/tasks?start=${encodeURIComponent(startISO)}&end=${encodeURIComponent(endISO)}`,
      ),
  });
}
