"use client";

import { TaskStatus } from "@prisma/client";
import { COLUMN_DOT } from "@/components/board/column-style";
import { COLUMN_LABEL } from "@/lib/kanban";
import type { TaskDTO } from "@/lib/types";

// Item de tarefa leve (sem drag-and-drop) para as visões de calendário.
export function TaskItem({
  task,
  showTime = false,
  compact = false,
}: {
  task: TaskDTO;
  showTime?: boolean;
  compact?: boolean;
}) {
  const time =
    showTime && task.dueDate
      ? new Date(task.dueDate).toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : null;

  if (compact) {
    return (
      <div className="flex items-center gap-1 truncate text-[11px] leading-tight">
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: COLUMN_DOT[task.status] }}
        />
        <span className="truncate">{task.title}</span>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 rounded-lg border border-border bg-card p-2.5">
      <span
        className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: COLUMN_DOT[task.status] }}
        title={COLUMN_LABEL[task.status as TaskStatus]}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{task.title}</p>
        <p className="text-xs text-muted-foreground">
          {COLUMN_LABEL[task.status as TaskStatus]}
          {time && ` · ${time}`}
        </p>
      </div>
    </div>
  );
}
