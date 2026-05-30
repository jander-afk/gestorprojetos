"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { TaskStatus } from "@prisma/client";
import { useProjects, useCreateTask } from "@/hooks/use-tasks";
import { TaskDialog } from "./task-dialog";
import { cn } from "@/lib/cn";

// Botão de acesso rápido: cria uma atividade e abre o modal completo para
// editar todos os detalhes. Usado no menu (status A fazer) e no Hoje (Foco).
export function NewTaskButton({
  status = TaskStatus.BACKLOG,
  label = "Nova atividade",
  alwaysLabel = false,
  className,
}: {
  status?: TaskStatus;
  label?: string;
  alwaysLabel?: boolean;
  className?: string;
}) {
  const { data: projects } = useProjects();
  const projectId = projects?.[0]?.id;
  const create = useCreateTask(projectId ?? "");
  const [openId, setOpenId] = useState<string | null>(null);

  async function onClick() {
    if (!projectId) return;
    const t = await create.mutateAsync({ title: "Nova atividade", status });
    setOpenId(t.id);
  }

  return (
    <>
      <button
        onClick={onClick}
        disabled={!projectId || create.isPending}
        className={cn(
          "inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50",
          className,
        )}
      >
        <Plus className="h-4 w-4" />
        <span className={alwaysLabel ? "" : "hidden sm:inline"}>{label}</span>
      </button>
      <TaskDialog taskId={openId} onClose={() => setOpenId(null)} />
    </>
  );
}
