"use client";

import { Sun, Clock } from "lucide-react";
import { useFocusToday, useTasksRange } from "@/hooks/use-views";
import { dayBounds, fmt } from "@/lib/view-dates";
import { TaskItem } from "./task-item";
import { NewTaskButton } from "@/components/tasks/new-task-button";
import { TaskStatus } from "@prisma/client";

export function DailyView() {
  const today = new Date();
  const { start, end } = dayBounds(today);

  const focus = useFocusToday();
  const due = useTasksRange(start.toISOString(), end.toISOString());

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm capitalize text-muted-foreground">
          {fmt(today, "EEEE, d 'de' MMMM")}
        </p>
        <NewTaskButton
          status={TaskStatus.FOCO_HOJE}
          label="Nova atividade para hoje"
          alwaysLabel
        />
      </div>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <Sun className="h-5 w-5 text-primary" />
          <h2 className="font-heading text-lg font-semibold">Foco de Hoje</h2>
        </div>
        <div className="space-y-2">
          {focus.isLoading && (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          )}
          {focus.data?.length === 0 && (
            <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
              Nada em foco. Mova tarefas para “Foco de Hoje” no quadro.
            </p>
          )}
          {focus.data?.map((t) => (
            <TaskItem key={t.id} task={t} />
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <Clock className="h-5 w-5 text-secondary" />
          <h2 className="font-heading text-lg font-semibold">Agenda de hoje</h2>
        </div>
        <div className="space-y-2">
          {due.isLoading && (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          )}
          {due.data?.length === 0 && (
            <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
              Nenhum prazo para hoje.
            </p>
          )}
          {due.data?.map((t) => (
            <TaskItem key={t.id} task={t} showTime />
          ))}
        </div>
      </section>
    </div>
  );
}
