import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  addWeeks,
  addMonths,
  isSameDay,
  isSameMonth,
  format,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import type { TaskDTO } from "@/lib/types";

// Helpers de data do CLIENTE (no fuso do navegador). Semana de seg a dom.

export const fmt = (d: Date, pattern: string) =>
  format(d, pattern, { locale: ptBR });

export function dayBounds(ref = new Date()) {
  return { start: startOfDay(ref), end: endOfDay(ref) };
}

export function weekBounds(ref = new Date()) {
  return {
    start: startOfWeek(ref, { weekStartsOn: 1 }),
    end: endOfWeek(ref, { weekStartsOn: 1 }),
  };
}

export function weekDays(ref = new Date()): Date[] {
  const s = startOfWeek(ref, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => addDays(s, i));
}

export function monthBounds(ref = new Date()) {
  const gridStart = startOfWeek(startOfMonth(ref), { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(ref), { weekStartsOn: 1 });
  return { gridStart, gridEnd };
}

export function monthGrid(ref = new Date()): Date[] {
  const { gridStart, gridEnd } = monthBounds(ref);
  const days: Date[] = [];
  let d = gridStart;
  while (d <= gridEnd) {
    days.push(d);
    d = addDays(d, 1);
  }
  return days;
}

// Tarefas cujo prazo cai em determinado dia.
export function tasksOnDay(tasks: TaskDTO[], day: Date): TaskDTO[] {
  return tasks
    .filter((t) => t.dueDate && isSameDay(new Date(t.dueDate), day))
    .sort(
      (a, b) =>
        new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime(),
    );
}

export { addWeeks, addMonths, isSameDay, isSameMonth };
