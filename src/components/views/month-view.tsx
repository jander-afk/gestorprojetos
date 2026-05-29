"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTasksRange } from "@/hooks/use-views";
import {
  monthBounds,
  monthGrid,
  tasksOnDay,
  addMonths,
  isSameDay,
  isSameMonth,
  fmt,
} from "@/lib/view-dates";
import { TaskItem } from "./task-item";
import { cn } from "@/lib/cn";

const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export function MonthView() {
  const [offset, setOffset] = useState(0);
  const ref = addMonths(new Date(), offset);
  const { gridStart, gridEnd } = monthBounds(ref);
  const days = monthGrid(ref);

  const { data: tasks = [], isLoading } = useTasksRange(
    gridStart.toISOString(),
    gridEnd.toISOString(),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold capitalize">
          {fmt(ref, "MMMM yyyy")}
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setOffset((o) => o - 1)}
            className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted-foreground hover:bg-muted"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => setOffset(0)}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted"
          >
            Hoje
          </button>
          <button
            onClick={() => setOffset((o) => o + 1)}
            className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted-foreground hover:bg-muted"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {isLoading && (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      )}

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-border bg-border">
        {WEEKDAYS.map((w) => (
          <div
            key={w}
            className="bg-card py-2 text-center text-xs font-medium text-muted-foreground"
          >
            {w}
          </div>
        ))}

        {days.map((day) => {
          const dayTasks = tasksOnDay(tasks, day);
          const inMonth = isSameMonth(day, ref);
          const today = isSameDay(day, new Date());
          return (
            <div
              key={day.toISOString()}
              className={cn(
                "min-h-[84px] bg-card p-1.5",
                !inMonth && "opacity-40",
              )}
            >
              <div
                className={cn(
                  "mb-1 grid h-6 w-6 place-items-center rounded-full text-xs font-medium",
                  today
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground",
                )}
              >
                {fmt(day, "d")}
              </div>
              <div className="space-y-1">
                {dayTasks.slice(0, 3).map((t) => (
                  <TaskItem key={t.id} task={t} compact />
                ))}
                {dayTasks.length > 3 && (
                  <p className="text-[10px] text-muted-foreground">
                    +{dayTasks.length - 3}
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
