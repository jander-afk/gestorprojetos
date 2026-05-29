"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Clock, MessageSquare } from "lucide-react";
import { TaskStatus, Priority } from "@prisma/client";
import { COLUMN_ORDER, COLUMN_LABEL } from "@/lib/kanban";
import type { TaskDTO } from "@/lib/types";
import { cn } from "@/lib/cn";

const PRIORITY_COLOR: Record<Priority, string> = {
  BAIXA: "#94A3B8",
  MEDIA: "#55BDBE",
  ALTA: "#E7632F",
  URGENTE: "#DC2626",
};

function formatDue(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TaskCard({
  task,
  onChangeStatus,
  overlay = false,
}: {
  task: TaskDTO;
  onChangeStatus?: (taskId: string, status: TaskStatus) => void;
  overlay?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-lg border border-border bg-card p-3 shadow-sm",
        isDragging && "opacity-40",
        overlay && "rotate-1 shadow-lg",
      )}
    >
      <div className="flex items-start gap-2">
        {/* Alça de arraste — só ela inicia o drag, p/ o select funcionar */}
        <button
          {...attributes}
          {...listeners}
          aria-label="Arrastar"
          className="-ml-1 mt-0.5 cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-snug">{task.title}</p>

          {task.labels.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {task.labels.map(({ label }) => (
                <span
                  key={label.id}
                  className="rounded px-1.5 py-0.5 text-[11px] font-medium"
                  style={{ backgroundColor: `${label.color}22`, color: label.color }}
                >
                  {label.name}
                </span>
              ))}
            </div>
          )}

          <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: PRIORITY_COLOR[task.priority] }}
              title={`Prioridade: ${task.priority}`}
            />
            {task.dueDate && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {formatDue(task.dueDate)}
              </span>
            )}
            {task._count && task._count.comments > 0 && (
              <span className="inline-flex items-center gap-1">
                <MessageSquare className="h-3.5 w-3.5" />
                {task._count.comments}
              </span>
            )}
          </div>

          {/* Mover de coluna sem arrastar — essencial no mobile */}
          {onChangeStatus && !overlay && (
            <select
              value={task.status}
              onChange={(e) =>
                onChangeStatus(task.id, e.target.value as TaskStatus)
              }
              className="mt-2 w-full rounded-md border border-input bg-background px-2 py-1 text-xs text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
            >
              {COLUMN_ORDER.map((s) => (
                <option key={s} value={s}>
                  Mover para: {COLUMN_LABEL[s]}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
    </div>
  );
}
