"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { TaskStatus, Priority } from "@prisma/client";
import { apiGet, apiSend } from "@/lib/api";
import type { TaskDTO, LabelDTO } from "@/lib/types";

function invalidateAll(qc: ReturnType<typeof useQueryClient>, taskId?: string) {
  qc.invalidateQueries({ queryKey: ["board"] });
  qc.invalidateQueries({ queryKey: ["range"] });
  qc.invalidateQueries({ queryKey: ["focus-today"] });
  if (taskId) qc.invalidateQueries({ queryKey: ["task", taskId] });
}

export function useTask(id: string | null) {
  return useQuery({
    queryKey: ["task", id ?? ""],
    queryFn: () => apiGet<TaskDTO>(`/api/tasks/${id}`),
    enabled: !!id,
  });
}

export type UpdateTaskFields = {
  title?: string;
  description?: string;
  priority?: Priority;
  status?: TaskStatus;
  startDate?: string | null;
  dueDate?: string | null;
  labelIds?: string[];
};

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...fields }: { id: string } & UpdateTaskFields) =>
      apiSend<TaskDTO>(`/api/tasks/${id}`, "PATCH", fields),
    onSuccess: (_d, v) => invalidateAll(qc, v.id),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiSend<void>(`/api/tasks/${id}`, "DELETE"),
    onSuccess: () => invalidateAll(qc),
  });
}

// ---- Checklist ----
export function useAddChecklistItem(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (text: string) =>
      apiSend(`/api/tasks/${taskId}/checklist`, "POST", { text }),
    onSuccess: () => invalidateAll(qc, taskId),
  });
}

export function useUpdateChecklistItem(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...patch }: { id: string; text?: string; done?: boolean }) =>
      apiSend(`/api/checklist/${id}`, "PATCH", patch),
    onSuccess: () => invalidateAll(qc, taskId),
  });
}

export function useDeleteChecklistItem(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiSend<void>(`/api/checklist/${id}`, "DELETE"),
    onSuccess: () => invalidateAll(qc, taskId),
  });
}

export function useSuggestChecklist(taskId: string) {
  return useMutation({
    mutationFn: () =>
      apiGet<{ suggestions: string[] }>(`/api/tasks/${taskId}/checklist/suggest`),
  });
}

// ---- Labels (categorias) ----
export function useLabels(projectId: string | undefined) {
  return useQuery({
    queryKey: ["labels", projectId ?? ""],
    queryFn: () => apiGet<LabelDTO[]>(`/api/labels?projectId=${projectId}`),
    enabled: !!projectId,
  });
}

export function useCreateLabel(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; color?: string }) =>
      apiSend<LabelDTO>("/api/labels", "POST", { ...input, projectId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["labels", projectId] }),
  });
}

// ---- Comentários / observações ----
export function useAddComment(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) =>
      apiSend(`/api/tasks/${taskId}/comments`, "POST", { body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["task", taskId] }),
  });
}

export function useDeleteComment(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiSend<void>(`/api/comments/${id}`, "DELETE"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["task", taskId] }),
  });
}
