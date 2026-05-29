import { NotificationStatus, NotificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  notificationsQueue,
  JOB,
  deadlineJobId,
  morningJobId,
} from "@/lib/queue";
import { getManager } from "./recipient";

// ---------- Lembrete de prazo (T-2h, delayed job) ----------

export async function scheduleDeadlineReminder(taskId: string): Promise<void> {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task?.dueDate) return;

  const rec = await getManager();
  if (!rec || !rec.setting.enabled || !rec.setting.lembretePrazoEnabled) return;

  // sempre limpa o agendamento anterior antes de recriar
  await cancelDeadlineReminder(taskId);

  const now = Date.now();
  if (task.dueDate.getTime() <= now) return; // prazo já passou: nada a fazer

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
}

export async function cancelDeadlineReminder(taskId: string): Promise<void> {
  await notificationsQueue.remove(deadlineJobId(taskId)).catch(() => {});
  await prisma.notificationLog.updateMany({
    where: {
      taskId,
      type: NotificationType.LEMBRETE_PRAZO,
      status: NotificationStatus.AGENDADA,
    },
    data: { status: NotificationStatus.CANCELADA },
  });
}

// ---------- Resumo matinal (job repetível / Job Scheduler) ----------
// Usa o Job Scheduler do BullMQ (upsert idempotente), com cron no fuso do
// usuário. Reagendar é só chamar de novo: o upsert substitui o anterior.

export async function scheduleMorningSummary(userId: string): Promise<void> {
  const rec = await getManager(userId);
  if (!rec) return;

  const [h, m] = rec.setting.resumoMatinalTime.split(":").map(Number);
  const pattern = `${m} ${h} * * *`; // todo dia em HH:mm

  await notificationsQueue.upsertJobScheduler(
    morningJobId(rec.user.id),
    { pattern, tz: rec.user.timezone },
    { name: JOB.MORNING_SUMMARY, data: { userId: rec.user.id } },
  );
}

export async function cancelMorningSummary(userId: string): Promise<void> {
  await notificationsQueue.removeJobScheduler(morningJobId(userId)).catch(() => {});
}
