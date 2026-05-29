import { Prisma, TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { HttpError } from "@/lib/http";
import { computePosition, POSITION_GAP } from "@/lib/kanban";
import type {
  CreateTaskInput,
  UpdateTaskInput,
  MoveTaskInput,
} from "@/lib/validators";
import { dispatchStatusChange } from "@/server/notifications/dispatcher";
import {
  scheduleDeadlineReminder,
  cancelDeadlineReminder,
} from "@/server/notifications/scheduler";

// include padrão usado nas respostas (labels e contagem de comentários).
const taskInclude = {
  labels: { include: { label: true } },
  _count: { select: { comments: true } },
} satisfies Prisma.TaskInclude;

// ---------- Leituras ----------

/** Todas as tarefas de um projeto, prontas para montar as 7 colunas. */
export function getBoard(projectId: string) {
  return prisma.task.findMany({
    where: { projectId },
    orderBy: [{ status: "asc" }, { position: "asc" }],
    include: taskInclude,
  });
}

/** Tarefas com prazo dentro de uma janela (visões Semanal/Mensal). */
export function getTasksByDueRange(startUtc: Date, endUtc: Date) {
  return prisma.task.findMany({
    where: { dueDate: { gte: startUtc, lte: endUtc } },
    orderBy: [{ dueDate: "asc" }, { position: "asc" }],
    include: taskInclude,
  });
}

/** Coluna "Foco de Hoje" (visão Diária). */
export function getFocusToday() {
  return prisma.task.findMany({
    where: { status: TaskStatus.FOCO_HOJE },
    orderBy: { position: "asc" },
    include: taskInclude,
  });
}

async function getTaskOrThrow(id: string) {
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) throw new HttpError(404, "Tarefa não encontrada");
  return task;
}

// ---------- Efeitos colaterais de mudança de status ----------
// Centraliza tudo que precisa acontecer quando uma tarefa muda de coluna:
// auditoria, completedAt e os disparos de notificação.

async function onStatusChanged(
  taskId: string,
  fromStatus: TaskStatus,
  toStatus: TaskStatus,
  action: string,
) {
  await prisma.taskActivity.create({
    data: { taskId, fromStatus, toStatus, action },
  });
  // dispatcher decide (lendo as preferências) se gargalo/sucesso disparam.
  await dispatchStatusChange(taskId, toStatus);
}

// completedAt acompanha a entrada/saída de CONCLUIDO.
function completedAtFor(toStatus: TaskStatus, current: Date | null): Date | null {
  if (toStatus === TaskStatus.CONCLUIDO) return current ?? new Date();
  return null;
}

// ---------- Escritas ----------

export async function createTask(input: CreateTaskInput) {
  const status = input.status ?? TaskStatus.BACKLOG;

  // posição no fim da coluna de destino
  const last = await prisma.task.findFirst({
    where: { projectId: input.projectId, status },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  const position = last ? last.position + POSITION_GAP : POSITION_GAP;

  const task = await prisma.task.create({
    data: {
      title: input.title,
      description: input.description,
      projectId: input.projectId,
      status,
      priority: input.priority,
      startDate: input.startDate ?? undefined,
      dueDate: input.dueDate ?? undefined,
      position,
      labels: input.labelIds?.length
        ? { create: input.labelIds.map((labelId) => ({ labelId })) }
        : undefined,
    },
    include: taskInclude,
  });

  await prisma.taskActivity.create({
    data: { taskId: task.id, toStatus: status, action: "CREATED" },
  });

  // agenda lembrete de prazo se houver dueDate
  if (task.dueDate) await scheduleDeadlineReminder(task.id);

  return task;
}

export async function updateTask(id: string, input: UpdateTaskInput) {
  const before = await getTaskOrThrow(id);
  const statusChanged =
    input.status !== undefined && input.status !== before.status;

  const updated = await prisma.task.update({
    where: { id },
    data: {
      title: input.title,
      description: input.description,
      priority: input.priority,
      status: input.status,
      startDate: input.startDate ?? undefined,
      dueDate: input.dueDate ?? undefined,
      completedAt: statusChanged
        ? completedAtFor(input.status!, before.completedAt)
        : undefined,
      labels: input.labelIds
        ? {
            deleteMany: {},
            create: input.labelIds.map((labelId) => ({ labelId })),
          }
        : undefined,
    },
    include: taskInclude,
  });

  if (statusChanged) {
    await onStatusChanged(id, before.status, updated.status, "UPDATED");
  }

  // dueDate mudou (incluindo virar null) -> reagenda/cancela lembrete
  const dueChanged =
    input.dueDate !== undefined &&
    (before.dueDate?.getTime() ?? null) !==
      (updated.dueDate?.getTime() ?? null);
  if (dueChanged) {
    await cancelDeadlineReminder(id);
    if (updated.dueDate && updated.status !== TaskStatus.CONCLUIDO) {
      await scheduleDeadlineReminder(id);
    }
  }

  return updated;
}

/** Movimentação no quadro: muda coluna e/ou reordena via vizinhos. */
export async function moveTask(id: string, input: MoveTaskInput) {
  const before = await getTaskOrThrow(id);

  const [prevTask, nextTask] = await Promise.all([
    input.beforeId
      ? prisma.task.findUnique({
          where: { id: input.beforeId },
          select: { position: true },
        })
      : null,
    input.afterId
      ? prisma.task.findUnique({
          where: { id: input.afterId },
          select: { position: true },
        })
      : null,
  ]);

  // Sem vizinhos informados => "mandar para o fim" da coluna de destino.
  // (computePosition trataria como coluna vazia; aqui calculamos o fim real.)
  let position: number;
  if (!input.beforeId && !input.afterId) {
    const last = await prisma.task.findFirst({
      where: { projectId: before.projectId, status: input.status },
      orderBy: { position: "desc" },
      select: { position: true },
    });
    position = last ? last.position + POSITION_GAP : POSITION_GAP;
  } else {
    position = computePosition(
      prevTask?.position ?? null,
      nextTask?.position ?? null,
    );
  }

  const statusChanged = input.status !== before.status;

  const updated = await prisma.task.update({
    where: { id },
    data: {
      status: input.status,
      position,
      completedAt: statusChanged
        ? completedAtFor(input.status, before.completedAt)
      