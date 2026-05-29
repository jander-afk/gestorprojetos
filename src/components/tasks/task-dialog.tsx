"use client";

import { useEffect, useState } from "react";
import { Trash2, Plus, Sparkles } from "lucide-react";
import { Priority } from "@prisma/client";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  useTask,
  useUpdateTask,
  useDeleteTask,
  useAddChecklistItem,
  useUpdateChecklistItem,
  useDeleteChecklistItem,
  useSuggestChecklist,
  useLabels,
  useCreateLabel,
} from "@/hooks/use-task-detail";
import { cn } from "@/lib/cn";

const PRIORITIES: Priority[] = [
  Priority.BAIXA,
  Priority.MEDIA,
  Priority.ALTA,
  Priority.URGENTE,
];
const PRIORITY_LABEL: Record<Priority, string> = {
  BAIXA: "Baixa",
  MEDIA: "Média",
  ALTA: "Alta",
  URGENTE: "Urgente",
};

function isoToLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
function localToIso(v: string): string | null {
  return v ? new Date(v).toISOString() : null;
}

export function TaskDialog({
  taskId,
  onClose,
}: {
  taskId: string | null;
  onClose: () => void;
}) {
  const { data: task, isLoading } = useTask(taskId);
  const update = useUpdateTask();
  const del = useDeleteTask();
  const id = task?.id ?? "";
  const addItem = useAddChecklistItem(id);
  const toggleItem = useUpdateChecklistItem(id);
  const delItem = useDeleteChecklistItem(id);
  const suggest = useSuggestChecklist(id);
  const { data: labels } = useLabels(task?.projectId);
  const createLabel = useCreateLabel(task?.projectId ?? "");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>(Priority.MEDIA);
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [labelIds, setLabelIds] = useState<string[]>([]);
  const [newItem, setNewItem] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description ?? "");
      setPriority(task.priority);
      setStartDate(isoToLocal(task.startDate));
      setDueDate(isoToLocal(task.dueDate));
      setLabelIds(task.labels.map((l) => l.label.id));
      setSuggestions([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task?.id]);

  function toggleLabel(lid: string) {
    setLabelIds((prev) =>
      prev.includes(lid) ? prev.filter((x) => x !== lid) : [...prev, lid],
    );
  }

  async function addNewLabel() {
    const name = newLabel.trim();
    if (!name || !task) return;
    const created = await createLabel.mutateAsync({ name });
    setLabelIds((prev) => [...prev, created.id]);
    setNewLabel("");
  }

  async function save() {
    if (!task) return;
    await update.mutateAsync({
      id: task.id,
      title: title.trim() || task.title,
      description,
      priority,
      startDate: localToIso(startDate),
      dueDate: localToIso(dueDate),
      labelIds,
    });
    onClose();
  }

  async function remove() {
    if (!task) return;
    if (!confirm("Excluir esta tarefa? Esta ação não pode ser desfeita.")) return;
    await del.mutateAsync(task.id);
    onClose();
  }

  async function loadSuggestions() {
    const r = await suggest.mutateAsync();
    const existing = new Set((task?.checklist ?? []).map((c) => c.text));
    setSuggestions(r.suggestions.filter((s) => !existing.has(s)));
  }

  const done = task?.checklist.filter((c) => c.done).length ?? 0;
  const total = task?.checklist.length ?? 0;

  return (
    <Dialog open={!!taskId} onClose={onClose} title="Tarefa">
      {isLoading || !task ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : (
        <div className="space-y-5">
          <div>
            <label className="mb-1 block text-sm font-medium">Título</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Categorias</label>
            <div className="flex flex-wrap gap-2">
              {labels?.map((l) => {
                const on = labelIds.includes(l.id);
                return (
                  <button
                    key={l.id}
                    onClick={() => toggleLabel(l.id)}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-xs font-medium transition",
                      on ? "text-white" : "",
                    )}
                    style={
                      on
                        ? { backgroundColor: l.color, borderColor: l.color }
                        : { borderColor: l.color, color: l.color }
                    }
                  >
                    {l.name}
                  </button>
                );
              })}
            </div>
            <div className="mt-2 flex gap-2">
              <input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addNewLabel()}
                placeholder="Nova categoria…"
                className="h-9 flex-1 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <Button size="sm" variant="outline" onClick={addNewLabel}>
                Adicionar
              </Button>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Detalhe a atividade…"
              className="w-full rounded-lg border border-input bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Prioridade</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="h-10 w-full rounded-lg border border-input bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_LABEL[p]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Início</label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-10 w-full rounded-lg border border-input bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Prazo</label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-10 w-full rounded-lg border border-input bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium">
                Checklist{" "}
                {total > 0 && (
                  <span className="text-muted-foreground">
                    ({done}/{total})
                  </span>
                )}
              </label>
              <button
                onClick={loadSuggestions}
                disabled={suggest.isPending}
                className="inline-flex items-center gap-1 text-xs font-medium text-secondary hover:underline"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Sugerir
              </button>
            </div>

            <div className="space-y-1.5">
              {task.checklist.map((item) => (
                <div key={item.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() =>
                      toggleItem.mutate({ id: item.id, done: !item.done })
                    }
                    className="h-4 w-4 accent-[var(--primary)]"
                  />
                  <span
                    className={cn(
                      "flex-1 text-sm",
                      item.done && "text-muted-foreground line-through",
                    )}
                  >
                    {item.text}
                  </span>
                  <button
                    onClick={() => delItem.mutate(item.id)}
                    className="text-muted-foreground hover:text-accent"
                    aria-label="Remover item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            {suggestions.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      addItem.mutate(s);
                      setSuggestions((p) => p.filter((x) => x !== s));
                    }}
                    className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
                  >
                    <Plus className="h-3 w-3" />
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div className="mt-2 flex gap-2">
              <input
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newItem.trim()) {
                    addItem.mutate(newItem.trim());
                    setNewItem("");
                  }
                }}
                placeholder="Novo item do checklist…"
                className="h-9 flex-1 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (newItem.trim()) {
                    addItem.mutate(newItem.trim());
                    setNewItem("");
                  }
                }}
              >
                Adicionar
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-border pt-4">
            <button
              onClick={remove}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
            >
              <Trash2 className="h-4 w-4" />
              Excluir
            </button>
            <Button onClick={save} disabled={update.isPending}>
              {update.isPending ? "Salvando…" : "Salvar"}
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
