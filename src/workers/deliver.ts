import { Prisma, NotificationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getWhatsappProvider } from "@/server/whatsapp";
import type { BuiltMessage } from "@/server/notifications/templates";

// Envia uma mensagem já construída e atualiza o NotificationLog.
// Em falha, relança para o BullMQ retentar (attempts/backoff da fila).
export async function deliver(
  logId: string,
  to: string,
  built: BuiltMessage,
): Promise<void> {
  await prisma.notificationLog.update({
    where: { id: logId },
    data: {
      toNumber: to,
      templateName: built.templateName,
      payload: built.bodyParams as Prisma.InputJsonValue,
    },
  });

  try {
    const res = await getWhatsappProvider().sendTemplate({
      to,
      templateName: built.templateName,
      locale: built.locale,
      bodyParams: built.bodyParams,
    });
    await prisma.notificationLog.update({
      where: { id: logId },
      data: {
        status: NotificationStatus.ENVIADA,
        wamid: res.messageId,
        sentAt: new Date(),
        error: null,
      },
    });
  } catch (err) {
    await prisma.notificationLog.update({
      where: { id: logId },
      data: {
        status: NotificationStatus.FALHOU,
        error: err instanceof Error ? err.message : String(err),
      },
    });
    throw err;
  }
}

// Falha definitiva (não adianta retentar): sem número de destino.
export async function markFailed(logId: string, reason: string): Promise<void> {
  await prisma.notificationLog.update({
    where: { id: logId },
    data: { status: NotificationStatus.FALHOU, error: reason },
  });
}

export async function markCanceled(logId: string): Promise<void> {
  await prisma.notificationLog.update({
    where: { id: logId },
    data: { status: NotificationStatus.CANCELADA },
  });
}
