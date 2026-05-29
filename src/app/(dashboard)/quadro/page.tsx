"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useProjects, useBoard } from "@/hooks/use-tasks";
import { KanbanBoard } from "@/components/board/kanban-board";
import { Button } from "@/components/ui/button";
import { apiSend } from "@/lib/api";

export default function QuadroPage() {
  const qc = useQueryClient();
  const { data: projects, isLoading } = useProjects();
  const [projectId, setProjectId] = useState<string>();

  // seleciona o primeiro quadro assim que a lista chega
  useEffect(() => {
    if (!projectId && projects && projects.length > 0) {
      setProjectId(projects[0].id);
    }
  }, [projects, projectId]);

  const { data: tasks, isLoading: loadingTasks } = useBoard(projectId);

  async function createProject() {
    const p = await apiSend<{ id: string }>("/api/projects", "POST", {
      name: "Meu Quadro",
    });
    await qc.invalidateQueries({ queryKey: ["projects"] });
    setProjectId(p.id);
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando…</p>;
  }

  if (!projects || projects.length === 0) {
    return (
      <div className="grid place-items-center py-20 text-center">
        <p className="mb-4 text-sm text-muted-foreground">
          Você ainda não tem um quadro.
        </p>
        <Button onClick={createProject}>Criar meu primeiro quadro</Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {projects.length > 1 && (
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      )}

      {loadingTasks || !tasks ? (
        <p className="text-sm text-muted-foreground">Carregando tarefas…</p>
      ) : (
        <KanbanBoard projectId={projectId!} tasks={tasks} />
      )}
    </div>
  );
}
