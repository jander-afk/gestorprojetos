"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTasksRange } from "@/hooks/use-views";
import {
  weekBounds,
  weekDays,
  tasksOnDay,
  addWeeks,
  isSameDay,
  fmt,
} from "@/lib/view-dates";
import { TaskItem } from "./task-item";
import { cn } from "@/lib/cn";

export function WeekView() {
  const [offset, setOffset] = useState(0);
  const ref = addWeeks(new Date(), offset);
  const { start, end } = weekBounds(ref);
  const days = weekDays(ref);

  const { data: tasks = [], isLoading } = useTasksRange(
    start.toISOString(),
    end.toISOString(),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold">
          {fmt(start, "d MMM")} – {fmt(end, "d MMM")}
        </h2>
        <div className="flex items-center gap-1">
          <NavBtn onClick={() => setOffset((o) => o - 1)}>
            <ChevronLeft className="h-5 w-5" />
          </NavBtn>
          <button
            onClick={() => setOffset(0)}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted"
          >
            Hoje
          </button>
          <NavBtn onClick={() => setOffset((o) => o + 1)}>
            <ChevronRight className="h-5 w-5" />
          </NavBtn>
        </div>
      </div>

      {isLoading && (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      )}

      {/* mobile: dias empilhados · desktop: 7 colunas */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-7">
        {days.map((day) => {
          const dayTasks = tasksOnDay(tasks, day);
          const today = isSameDay(day, new Date());
          return (
            <div
              key={day.toISOString()}
              className="rounded-xl border border-border bg-muted/30 p-2"
            >
              <div
                className={cn(
                  "mb-2 flex items-baseline gap-1 px-1 text-sm font-medium capitalize",
                  today ? "text-primary" : "text-muted-foreground",
                )}
              >
                {fmt(day, "EEE")}
                <span className="text-base font-semibold text-foreground">
                  {fmt(day, "d")}
                </span>
              </div>
              <div className="space-y-2">
                {dayTasks.map((t) => (
                  <TaskItem key={t.id} task={t} showTime />
                ))}
                {dayTasks.length === 0 && (
                  <p className="px-1 py-2 text-xs text-muted-foreground/60">
                    —
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NavBtn({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted-foreground hover:bg-muted"
    >
      {children}
    </button>
  );
}
