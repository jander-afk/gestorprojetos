import { NotificationType, TaskStatus } from "@prisma/client";
import type { Task } from "@prisma/client";
import { COLUMN_LABEL } from "@/lib/kanban";
import { formatInTz } from "@/lib/dates";

// Mapeia cada tipo de notificação para o Message Template aprovado na Meta
// e monta os parâmetros do corpo na ordem dos {{n}}.
//
// REGRA DA META: parâmetro de corpo não pode ter quebra de linha, tab nem
// 4+ espaços seguidos. Por isso listas viram texto separado por vírgula.

export const TEMPLATE_NAME: Record<NotificationType, string> = {
  RESUMO_MATINAL: "resumo_matinal",
  ALERTA_GARGALO: "alerta_gargalo",
  ALERTA_SUCESSO: "alerta_sucesso",
  LEMBRETE_PRAZO: "lembrete_prazo",
};

export const LOCALE = process.env.META_TEMPLATE_LOCALE ?? "pt_BR";

export type BuiltMessage = {
  templateName: string;
  locale: string;
  bodyParams: string[];
};

// remove quebras de linha/tabs e corta tamanho para caber no parâmetro
function sanitize(text: string, max = 120): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

// ALERTA_GARGALO -> {{1}} = título da tarefa
export function buildBottleneck(task: Task): BuiltMessage {
  return {
    templateName: TEMPLATE_NAME.ALERTA_GARGALO,
    locale: LOCALE,
    bodyParams: [sanitize(task.title)],
  };
}

// ALERTA_SUCESSO -> {{1}} = título, {{2}} = coluna (Aprovado/Concluído)
export function buildSuccess(task: Task): BuiltMessage {
  return {
    templateName: TEMPLATE_NAME.ALERTA_SUCESSO,
    locale: LOCALE,
    bodyParams: [sanitize(task.title), COLUMN_LABEL[task.status]],
  };
}

// LEMBRETE_PRAZO -> {{1}} = título, {{2}} = data/hora do prazo no fuso
export function buildDeadline(task: Task, tz: string): BuiltMessage {
  const due = task.dueDate ? formatInTz(task.dueDate, tz, "dd/MM 'às' HH:mm") : "-";
  return {
    templateName: TEMPLATE_NAME.LEMBRETE_PRAZO,
    locale: LOCALE,
    bodyParams: [sanitize(task.title), due],
  };
}

// RESUMO_MATINAL -> {{1}} = quantidade, {{2}} = títulos separados por vírgula
export function buildMorningSummary(tasks: Task[]): BuiltMessage {
  const count = String(tasks.length);
  const list = tasks.length
    ? sanitize(tasks.map((t) => t.title).join(", "), 600)
    : "nada para hoje 🎉";
  return {
    templateName: TEMPLATE_NAME.RESUMO_MATINAL,
    locale: LOCALE,
    bodyParams: [count, list],
  };
}

// Usado pelo dispatcher para decidir o tipo a partir do status de destino.
export function triggerTypeFor(status: TaskStatus): NotificationType | null {
  if (status === TaskStatus.PENDENTE) return NotificationType.ALERTA_GARGALO;
  if (status === TaskStatus.APROVADO || status === TaskStatus.CONCLUIDO)
    return NotificationType.ALERTA_SUCESSO;
  return null;
}
