"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { TaskStatus } from "@prisma/client";
import { apiGet, apiSend } from "@/lib/api";
import type { TaskDTO, ProjectDTO } from "@/lib/types";

export const boardKey = (projectId: string) => ["board", projectId] as const;

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: () => apiGet<ProjectDTO[]>("/api/projects"),
  });
}

export function useBoard(projectId: string | undefined) {
  return useQuery({
    queryKey: boardKey(projectId ?? ""),
    queryFn: () => apiGet<TaskDTO[]>(`/api/tasks?projectId=${projectId}`),
    enabled: !!projectId,
  });
}

export type MoveInput = {
  taskId: string;
  status: TaskStatus;
  beforeId?: string | null;
  afterId?: string | null;
};

export function useMoveTask(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, ...body }: MoveInput) =>
      apiSend<TaskDTO>(`/api/tasks/${taskId}/move`, "PATCH", body),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: boardKey(projectId) });
    },
  });
}

export function useCreateTask(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { title: string; status: TaskStatus }) =>
      apiSend<TaskDTO>("/api/tasks", "POST", { ...input, projectId }),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: boardKey(projectId) });
      qc.invalidateQueries({ queryKey: ["focus-today"] });
      qc.invalidateQueries({ queryKey: ["range"] });
    },
  });
}
