"use client";

import { useState } from "react";
import { ListChecks } from "lucide-react";
import { TaskStatus } from "@prisma/client";
import { COLUMN_DOT } from "@/components/board/column-style";
import { COLUMN_LABEL } from "@/lib/kanban";
import { TaskDialog } from "@/components/tasks/task-dialog";
import type { TaskDTO } from "@/lib/types";

// Item de tarefa para as visões de calendário. Clicar no título abre o
// modal completo (editar tudo, checklist, comentários, links).
export function TaskItem({
  task,
  showTime = false,
  compact = false,
}: {
  task: TaskDTO;
  showTime?: boolean;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const time =
    showTime && task.dueDate
      ? new Date(task.dueDate).toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : null;

  const done = task.checklist?.filter((c) => c.done).length ?? 0;
  const total = task.checklist?.length ?? 0;

  return (
    <>
      {compact ? (
        <button
          onClick={() => setOpen(true)}
          className="flex w-full items-center gap-1 truncate text-left text-[11px] leading-tight hover:opacity-70"
        >
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: COLUMN_DOT[task.status] }}
          />
          <span className="truncate">{task.title}</span>
        </button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex w-full items-start gap-2 rounded-lg border border-border bg-card p-2.5 text-left transition-colors hover:border-primary/40 hover:bg-muted/40"
        >
          <span
            className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: COLUMN_DOT[task.status] }}
            title={COLUMN_LABEL[task.status as TaskStatus]}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{task.title}</p>
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{COLUMN_LABEL[task.status as TaskStatus]}</span>
              {time && <span>· {time}</span>}
              {total > 0 && (
                <span className="inline-flex items-center gap-1">
                  <ListChecks className="h-3 w-3" />
                  {done}/{total}
                </span>
              )}
            </p>
          </div>
        </button>
      )}

      <TaskDialog taskId={open ? task.id : null} onClose={() => setOpen(false)} />
    </>
  );
}
