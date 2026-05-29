import { TaskStatus } from "@prisma/client";

// Ordem fixa das 7 colunas do Kanban e seus rótulos em português.
export const COLUMN_ORDER: TaskStatus[] = [
  TaskStatus.FOCO_HOJE,
  TaskStatus.BACKLOG,
  TaskStatus.EM_ANDAMENTO,
  TaskStatus.PENDENTE,
  TaskStatus.APROVADO,
  TaskStatus.EM_PRODUCAO,
  TaskStatus.CONCLUIDO,
];

export const COLUMN_LABEL: Record<TaskStatus, string> = {
  FOCO_HOJE: "Foco de Hoje",
  BACKLOG: "A fazer",
  EM_ANDAMENTO: "Em andamento",
  PENDENTE: "Pendente",
  APROVADO: "Aprovado",
  EM_PRODUCAO: "Em produção",
  CONCLUIDO: "Concluído",
};

// Quais transições disparam notificação.
export const STATUS_TRIGGERS_BOTTLENECK = (s: TaskStatus) =>
  s === TaskStatus.PENDENTE;

export const STATUS_TRIGGERS_SUCCESS = (s: TaskStatus) =>
  s === TaskStatus.APROVADO || s === TaskStatus.CONCLUIDO;

// Passo base entre cartões. Posições são floats; ao inserir entre dois
// cartões usamos a média. Reindexação completa só seria necessária se as
// posições convergissem (raro); o service trata esse caso recriando o gap.
export const POSITION_GAP = 1000;

/**
 * Calcula a posição de um cartão solto entre `before` e `after`.
 * - lista vazia            -> POSITION_GAP
 * - solto no topo          -> after / 2
 * - solto no fim           -> before + POSITION_GAP
 * - solto no meio          -> média de before e after
 */
export function computePosition(
  before: number | null,
  after: number | null,
): number {
  if (before == null && after == null) return POSITION_GAP;
  if (before == null) return (after as number) / 2;
  if (after == null) return before + POSITION_GAP;
  return (before + after) / 2;
}

export function isTaskStatus(value: string): value is TaskStatus {
  return (COLUMN_ORDER as string[]).includes(value);
}
