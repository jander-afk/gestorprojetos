import { NotificationStatus, TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getManager, recipientNumber } from "@/server/notifications/recipient";
import { buildDeadline } from "@/server/notifications/templates";
import { deliver, markFailed, markCanceled } from "./deliver";

// Processa LEMBRETE_PRAZO (job atrasado disparado em dueDate - antecedência).
export async function handleDeadline(logId: string): Promise<void> {
  const log = await prisma.notificationLog.findUnique({ where: { id: logId } });
  // só envia se ainda estiver AGENDADA (pode ter sido cancelada/reagendada)
  if (!log || log.status !== NotificationStatus.AGENDADA) return;
  if (!log.taskId) return;

  const task = await prisma.task.findUnique({ where: { id: log.taskId } });
  if (!task || !task.dueDate || task.status === TaskStatus.CONCLUIDO) {
    return void markCanceled(logId);
  }

  const rec = await getManager(log.userId);
  const to = rec ? recipientNumber(rec) : null;
  if (!to) return void markFailed(logId, "Sem número de WhatsApp configurado");

  await deliver(logId, to, buildDeadline(task, rec!.user.timezone));
}
