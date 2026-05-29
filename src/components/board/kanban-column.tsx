"use client";

import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { TaskStatus } from "@prisma/client";
import { COLUMN_LABEL } from "@/lib/kanban";
import { COLUMN_DOT } from "./column-style";
import { TaskCard } from "./task-card";
import type { TaskDTO } from "@/lib/types";

export function KanbanColumn({
  status,
  tasks,
  onChangeStatus,
  onCreate,
}: {
  status: TaskStatus;
  tasks: TaskDTO[];
  onChangeStatus: (taskId: string, status: TaskStatus) => void;
  onCreate: (title: string, status: TaskStatus) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="mb-3 flex items-center gap-2 px-1">
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: COLUMN_DOT[status] }}
        />
        <h2 className="text-sm font-semibold">{COLUMN_LABEL[status]}</h2>
        <span className="ml-auto text-xs text-muted-foreground">
          {tasks.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 space-y-2 rounded-xl p-2 transition-colors ${
          isOver ? "bg-primary/5" : "bg-muted/40"
        }`}
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onChangeStatus={onChangeStatus}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <p className="px-2 py-6 text-center text-xs text-muted-foreground">
            Sem tarefas aqui
          </p>
        )}

        <AddCard status={status} onCreate={onCreate} />
      </div>
    </div>
  );
}

function AddCard({
  status,
  onCreate,
}: {
  status: TaskStatus;
  onCreate: (title: string, status: TaskStatus) => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");

  function submit() {
    const t = title.trim();
    if (t) onCreate(t, status);
    setTitle("");
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
      >
        <Plus className="h-4 w-4" /> Adicionar tarefa
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-2">
      <textarea
        autoFocus
        rows={2}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
          if (e.key === "Escape") setOpen(false);
        }}
        placeholder="Título da tarefa…"
        className="w-full resize-none bg-transparent text-sm outline-none"
      />
      <div className="mt-1 flex justify-end gap-2">
        <button
          onClick={() => setOpen(false)}
          className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
        >
          Cancelar
        </button>
        <button
          onClick={submit}
          className="rounded bg-primary px-2 py-1 text-xs font-medium text-primary-foreground"
        >
          Adicionar
        </button>
      </div>
    </div>
  );
}
