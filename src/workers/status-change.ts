import { NotificationStatus, NotificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getManager, recipientNumber } from "@/server/notifications/recipient";
import { buildBottleneck, buildSuccess } from "@/server/notifications/templates";
import { deliver, markFailed, markCanceled } from "./deliver";

// Processa ALERTA_GARGALO / ALERTA_SUCESSO (disparo imediato).
export async function handleStatusChange(logId: string): Promise<void> {
  const log = await prisma.notificationLog.findUnique({ where: { id: logId } });
  if (!log || log.status === NotificationStatus.ENVIADA) return; // dedupe
  if (!log.taskId) return;

  const task = await prisma.task.findUnique({ where: { id: log.taskId } });
  if (!task) return void markCanceled(logId);

  const rec = await getManager(log.userId);
  const to = rec ? recipientNumber(rec) : null;
  if (!to) return void markFailed(logId, "Sem número de WhatsApp configurado");

  const built =
    log.type === NotificationType.ALERTA_GARGALO
      ? buildBottleneck(task)
      : buildSuccess(task);

  await deliver(logId, to, built);
}
