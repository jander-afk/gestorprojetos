import { NotificationStatus, NotificationType, TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { dayRange } from "@/lib/dates";
import { getManager, recipientNumber } from "@/server/notifications/recipient";
import { buildMorningSummary } from "@/server/notifications/templates";
import { deliver, markFailed } from "./deliver";

// Processa o RESUMO_MATINAL (job repetível às HH:mm no fuso do usuário).
export async function handleMorningSummary(userId: string): Promise<void> {
  const rec = await getManager(userId);
  if (!rec || !rec.setting.enabled || !rec.setting.resumoMatinalEnabled) return;

  // Dedupe: se já enviou hoje (no fuso do usuário), não repete em restart.
  const { startUtc, endUtc } = dayRange(rec.user.timezone);
  const already = await prisma.notificationLog.findFirst({
    where: {
      userId,
      type: NotificationType.RESUMO_MATINAL,
      status: NotificationStatus.ENVIADA,
      sentAt: { gte: startUtc, lte: endUtc },
    },
  });
  if (already) return;

  const tasks = await prisma.task.findMany({
    where: { status: TaskStatus.FOCO_HOJE },
    orderBy: { position: "asc" },
  });

  const log = await prisma.notificationLog.create({
    data: {
      type: NotificationType.RESUMO_MATINAL,
      userId,
      status: NotificationStatus.AGENDADA,
      scheduledFor: new Date(),
    },
  });

  const to = recipientNumber(rec);
  if (!to) return void markFailed(log.id, "Sem número de WhatsApp configurado");

  await deliver(log.id, to, buildMorningSummary(tasks));
}
