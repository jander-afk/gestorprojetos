import { prisma } from "@/lib/prisma";
import type { NotificationSetting, User } from "@prisma/client";

export type Recipient = { user: User; setting: NotificationSetting };

// App single-user: o destinatário das notificações é o gestor.
// Se userId não for passado, pega o (único) usuário. Cria o NotificationSetting
// default na primeira vez.
export async function getManager(userId?: string): Promise<Recipient | null> {
  const user = userId
    ? await prisma.user.findUnique({ where: { id: userId } })
    : await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });

  if (!user || !user.isActive) return null;

  const setting = await prisma.notificationSetting.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  });

  return { user, setting };
}

// Número de destino: override > número do usuário.
export function recipientNumber(r: Recipient): string | null {
  return r.setting.whatsappNumberOverride ?? r.user.whatsappNumber ?? null;
}
