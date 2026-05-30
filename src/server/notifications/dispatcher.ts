import { NotificationStatus, NotificationType, TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { notificationsQueue, JOB } from "@/lib/queue";
import { getManager } from "./recipient";
import { triggerTypeFor } from "./templates";

// Não pode lançar: falha de notificação não derruba a movimentação da tarefa.
export async function dispatchStatusChange(
  taskId: string,
  toStatus: TaskStatus,
): Promise<void> {
  try {
    const type = triggerTypeFor(toStatus);
    if (!type) return;

    const recipient = await getManager();
    if (!recipient) return;
    const { setting } = recipient;

    if (!setting.enabled) return;
    if (type === NotificationType.ALERTA_GARGALO && !setting.alertaGargaloEnabled) return;
    if (type === NotificationType.ALERTA_SUCESSO && !setting.alertaSucessoEnabled) return;

    const log = await prisma.notificationLog.create({
      data: {
        type,
        userId: recipient.user.id,
        taskId,
        status: NotificationStatus.AGENDADA,
      },
    });

    await notificationsQueue.add(JOB.STATUS_CHANGE, { logId: log.id });
  } catch (err) {
    console.error("[dispatcher] dispatchStatusChange falhou:", err);
  }
}
