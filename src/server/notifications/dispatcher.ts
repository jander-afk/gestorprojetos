import { NotificationStatus, NotificationType, TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { notificationsQueue, JOB } from "@/lib/queue";
import { getManager } from "./recipient";
import { triggerTypeFor } from "./templates";

// Chamado pelo service sempre que uma tarefa MUDA de coluna.
// Decide (lendo as preferências) se há notificação a enviar e, em caso
// afirmativo, cria o NotificationLog (AGENDADA) e ENFILEIRA o job.
// Não envia nada aqui — quem envia é o worker. Mantém a rota HTTP rápida.

export async function dispatchStatusChange(
  taskId: string,
  toStatus: TaskStatus,
): Promise<void> {
  const type = triggerTypeFor(toStatus);
  if (!type) return; // colunas que não notificam

  const recipient = await getManager();
  if (!recipient) return;
  const { setting } = recipient;

  if (!setting.enabled) return;
  if (type === NotificationType.ALERTA_GARGALO && !setting.alertaGargaloEnabled)
    return;
  if (type === NotificationType.ALERTA_SUCESSO && !setting.alertaSucessoEnabled)
    return;

  const log = await prisma.notificationLog.create({
    data: {
      type,
      userId: recipient.user.id,
      taskId,
      status: NotificationStatus.AGENDADA,
    },
  });

  await notificationsQueue.add(JOB.STATUS_CHANGE, { logId: log.id });
}
