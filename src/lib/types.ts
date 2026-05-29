import type { TaskStatus, Priority } from "@prisma/client";

// DTOs que o frontend consome da API (datas chegam como string ISO).
export type LabelDTO = { id: string; name: string; color: string };

export type TaskDTO = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  position: number;
  startDate: string | null;
  dueDate: string | null;
  completedAt: string | null;
  projectId: string;
  labels: { label: LabelDTO }[];
  _count?: { comments: number };
};

export type ProjectDTO = {
  id: string;
  name: string;
  description: string | null;
  color: string;
  isArchived: boolean;
  _count?: { tasks: number };
};
