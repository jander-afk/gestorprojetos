"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { TaskStatus, Priority } from "@prisma/client";
import { COLUMN_ORDER, COLUMN_LABEL } from "@/lib/kanban";
import { COLUMN_DOT } from "./column-style";
import { KanbanColumn } from "./kanban-column";
import { TaskCard } from "./task-card";
import { Search, X } from "lucide-react";
import { useLabels } from "@/hooks/use-task-detail";
import { TaskDialog } from "@/components/tasks/task-dialog";
import { useIsDesktop } from "@/hooks/use-media-query";
import { useMoveTask, useCreateTask } from "@/hooks/use-tasks";
import type { TaskDTO } from "@/lib/types";
import { cn } from "@/lib/cn";

type Grouped = Record<TaskStatus, TaskDTO[]>;

function group(tasks: TaskDTO[]): Grouped {
  const g = Object.fromEntries(COLUMN_ORDER.map((s) => [s, []])) as unknown as Grouped;
  for (const t of tasks) g[t.status].push(t);
  for (const s of COLUMN_ORDER) g[s].sort((a, b) => a.position - b.position);
  return g;
}

export function KanbanBoard({
  projectId,
  tasks,
}: {
  projectId: string;
  tasks: TaskDTO[];
}) {
  const isDesktop = useIsDesktop();
  const move = useMoveTask(projectId);
  const create = useCreateTask(projectId);

  const [items, setItems] = useState<Grouped>(() => group(tasks));
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [mobileStatus, setMobileStatus] = useState<TaskStatus>(
    TaskStatus.FOCO_HOJE,
  );
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const { data: labels } = useLabels(projectId);
  const [q, setQ] = useState("");
  const [catId, setCatId] = useState("");
  const [prio, setPrio] = useState("");
  const [dueF, setDueF] = useState<"all" | "overdue" | "week">("all");

  useEffect(() => {
    if (!activeId) setItems(group(tasks));
  }, [tasks, activeId]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const activeTask = useMemo(() => {
    if (!activeId) return null;
    for (const s of COLUMN_ORDER) {
      const t = items[s].find((x) => x.id === activeId);
      if (t) return t;
    }
    return null;
  }, [activeId, items]);

  function containerOf(state: Grouped, id: UniqueIdentifier): TaskStatus | null {
    if ((COLUMN_ORDER as string[]).includes(id as string))
      return id as TaskStatus;
    return COLUMN_ORDER.find((s) => state[s].some((t) => t.id === id)) ?? null;
  }

  function persist(taskId: string, status: TaskStatus, arr: TaskDTO[]) {
    const i = arr.findIndex((t) => t.id === taskId);
    move.mutate({
      taskId,
      status,
      beforeId: arr[i - 1]?.id ?? null,
      afterId: arr[i + 1]?.id ?? null,
    });
  }

  function onDragStart(e: DragStartEvent) {
    setActiveId(e.active.id);
  }

  function onDragOver(e: DragOverEvent) {
    const { active, over } = e;
    if (!over) return;
    setItems((prev) => {
      const from = containerOf(prev, active.id);
      const to = containerOf(prev, over.id);
      if (!from || !to || from === to) return prev;

      const moving = prev[from].find((t) => t.id === active.id);
      if (!moving) return prev;

      const overIsColumn = (COLUMN_ORDER as string[]).includes(over.id as string);
      const toArr = prev[to];
      const overIndex = overIsColumn
        ? toArr.length
        : toArr.findIndex((t) => t.id === over.id);
      const idx = overIndex < 0 ? toArr.length : overIndex;

      return {
        ...prev,
        [from]: prev[from].filter((t) => t.id !== active.id),
        [to]: [
          ...toArr.slice(0, idx),
          { ...moving, status: to },
          ...toArr.slice(idx),
        ],
      };
    });
  }

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setItems((prev) => {
      const to = containerOf(prev, active.id);
      if (!to) return prev;
      const arr = prev[to];
      const oldIndex = arr.findIndex((t) => t.id === active.id);

      const overIsColumn =
        over && (COLUMN_ORDER as string[]).includes(over.id as string);
      let newIndex = arr.length - 1;
      if (over && !overIsColumn) {
        const oi = arr.findIndex((t) => t.id === over.id);
        if (oi !== -1) newIndex = oi;
      }

      const reordered = arrayMove(arr, oldIndex, Math.max(0, newIndex));
      persist(active.id as string, to, reordered);
      return { ...prev, [to]: reordered };
    });
    setActiveId(null);
  }

  function changeStatus(taskId: string, status: TaskStatus) {
    setItems((prev) => {
      const from = containerOf(prev, taskId);
      if (!from || from === status) return prev;
      const moving = prev[from].find((t) => t.id === taskId)!;
      return {
        ...prev,
        [from]: prev[from].filter((t) => t.id !== taskId),
        [status]: [...prev[status], { ...moving, status }],
      };
    });
    move.mutate({ taskId, status, beforeId: null, afterId: null });
  }

  async function createTask(title: string, status: TaskStatus) {
    const t = await create.mutateAsync({ title, status });
    setEditingTaskId(t.id); // abre o modal para enriquecer a tarefa recém-criada
  }

  function matchesFilters(t: TaskDTO): boolean {
    if (q && !t.title.toLowerCase().includes(q.toLowerCase())) return false;
    if (catId && !t.labels.some((l) => l.label.id === catId)) return false;
    if (prio && t.priority !== prio) return false;
    if (dueF !== "all") {
      if (!t.dueDate) return false;
      const d = new Date(t.dueDate).getTime();
      const now = Date.now();
      if (dueF === "overdue" && !(d < now && t.status !== TaskStatus.CONCLUIDO)) return false;
      if (dueF === "week" && d > now + 7 * 86400000) return false;
    }
    return true;
  }
  const filtersActive = !!(q || catId || prio || dueF !== "all");
  const view: Grouped = filtersActive
    ? (Object.fromEntries(
        COLUMN_ORDER.map((s2) => [s2, items[s2].filter(matchesFilters)]),
      ) as unknown as Grouped)
    : items;

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar tarefa…"
            className="h-9 w-44 rounded-lg border border-input bg-background pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <select
          value={catId}
          onChange={(e) => setCatId(e.target.value)}
          className="h-9 rounded-lg border border-input bg-background px-2 text-sm text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Categoria</option>
          {labels?.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
        <select
          value={prio}
          onChange={(e) => setPrio(e.target.value)}
          className="h-9 rounded-lg border border-input bg-background px-2 text-sm text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Prioridade</option>
          <option value={Priority.URGENTE}>Urgente</option>
          <option value={Priority.ALTA}>Alta</option>
          <option value={Priority.MEDIA}>Média</option>
          <option value={Priority.BAIXA}>Baixa</option>
        </select>
        <select
          value={dueF}
          onChange={(e) => setDueF(e.target.value as "all" | "overdue" | "week")}
          className="h-9 rounded-lg border border-input bg-background px-2 text-sm text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">Prazo</option>
          <option value="overdue">Atrasadas</option>
          <option value="week">Próx. 7 dias</option>
        </select>
        {filtersActive && (
          <button
            onClick={() => { setQ(""); setCatId(""); setPrio(""); setDueF("all"); }}
            className="inline-flex h-9 items-center gap-1 rounded-lg px-2 text-sm text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" /> Limpar
          </button>
        )}
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        {isDesktop ? (
          <div className="flex h-[calc(100dvh-7rem)] gap-4 overflow-x-auto pb-3">
            {COLUMN_ORDER.map((status) => (
              <div key={status} className="flex w-72 shrink-0 flex-col">
                <KanbanColumn
                  status={status}
                  tasks={view[status]}
                  onChangeStatus={changeStatus}
                  onCreate={createTask}
                  onOpen={setEditingTaskId}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-[calc(100dvh-9.5rem)] flex-col">
            <div className="no-scrollbar -mx-4 mb-3 flex gap-2 overflow-x-auto px-4">
              {COLUMN_ORDER.map((status) => {
                const active = status === mobileStatus;
                return (
                  <button
                    key={status}
                    onClick={() => setMobileStatus(status)}
                    className={cn(
                      "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground",
                    )}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: COLUMN_DOT[status] }}
                    />
                    {COLUMN_LABEL[status]}
                    <span className="opacity-60">{view[status].length}</span>
                  </button>
                );
              })}
            </div>
            <div className="min-h-0 flex-1">
              <KanbanColumn
                status={mobileStatus}
                tasks={view[mobileStatus]}
                onChangeStatus={changeStatus}
                onCreate={createTask}
                onOpen={setEditingTaskId}
              />
            </div>
          </div>
        )}

        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} overlay /> : null}
        </DragOverlay>
      </DndContext>

      <TaskDialog taskId={editingTaskId} onClose={() => setEditingTaskId(null)} />
    </>
  );
}
