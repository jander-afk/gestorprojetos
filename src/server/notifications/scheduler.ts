import { NotificationStatus, NotificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  notificationsQueue,
  JOB,
  deadlineJobId,
  morningJobId,
} from "@/lib/queue";
import { getManager } from "./recipient";

// IMPORTANTE: nenhuma função aqui pode lançar — falha de notificação não pode
// derrubar a criação/edição de tarefa. Tudo encapsulado em try/catch.

export async function scheduleDeadlineReminder(taskId: string): Promise<void> {
  try {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task?.dueDate) return;

    const rec = await getManager();
    if (!rec || !rec.setting.enabled || !rec.setting.lembretePrazoEnabled) return;

    await cancelDeadlineReminder(taskId);

    const now = Date.now();
    if (task.dueDate.getTime() <= now) return;

    const fireAt = new Date(
      task.dueDate.getTime() - rec.setting.lembretePrazoMinutos * 60_000,
    );
    const delay = Math.max(0, fireAt.getTime() - now);

    const log = await prisma.notificationLog.create({
      data: {
        type: NotificationType.LEMBRETE_PRAZO,
        userId: rec.user.id,
        taskId,
        status: NotificationStatus.AGENDADA,
        scheduledFor: fireAt,
      },
    });

    await notificationsQueue.add(
      JOB.DEADLINE,
      { logId: log.id },
      { delay, jobId: deadlineJobId(taskId) },
    );
  } catch (err) {
    console.error("[scheduler] scheduleDeadlineReminder falhou:", err);
  }
}

export async function cancelDeadlineReminder(taskId: string): Promise<void> {
  try {
    await notificationsQueue.remove(deadlineJobId(taskId)).catch(() => {});
    await prisma.notificationLog.updateMany({
      where: {
        taskId,
        type: NotificationType.LEMBRETE_PRAZO,
        status: NotificationStatus.AGENDADA,
      },
      data: { status: NotificationStatus.CANCELADA },
    });
  } catch (err) {
    console.error("[scheduler] cancelDeadlineReminder falhou:", err);
  }
}

export async function scheduleMorningSummary(userId: string): Promise<void> {
  try {
    const rec = await getManager(userId);
    if (!rec) return;
    const [h, m] = rec.setting.resumoMatinalTime.split(":").map(Number);
    const pattern = `${m} ${h} * * *`;
    await notificationsQueue.upsertJobScheduler(
      morningJobId(rec.user.id),
      { pattern, tz: rec.user.timezone },
      { name: JOB.MORNING_SUMMARY, data: { userId: rec.user.id } },
    );
  } catch (err) {
    console.error("[scheduler] scheduleMorningSummary falhou:", err);
  }
}

export async function cancelMorningSummary(userId: string): Promise<void> {
  try {
    await notificationsQueue.removeJobScheduler(morningJobId(userId)).catch(() => {});
  } catch (err) {
    console.error("[scheduler] cancelMorningSummary falhou:", err);
  }
}
