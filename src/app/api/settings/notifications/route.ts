import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { errorResponse } from "@/lib/http";
import { notificationSettingsSchema } from "@/lib/validators";
import {
  scheduleMorningSummary,
  cancelMorningSummary,
} from "@/server/notifications/scheduler";

// GET /api/settings/notifications — preferências do gestor (cria default se faltar)
export async function GET() {
  try {
    const user = await requireUser();
    const setting = await prisma.notificationSetting.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });
    return NextResponse.json(setting);
  } catch (err) {
    return errorResponse(err);
  }
}

// PUT /api/settings/notifications — atualiza e reconcilia o agendamento do resumo
export async function PUT(req: NextRequest) {
  try {
    const user = await requireUser();
    const data = notificationSettingsSchema.parse(await req.json());

    const setting = await prisma.notificationSetting.upsert({
      where: { userId: user.id },
      update: data,
      create: { userId: user.id, ...data },
    });

    // Resumo matinal: (re)agenda ou cancela conforme as preferências.
    if (setting.enabled && setting.resumoMatinalEnabled) {
      await scheduleMorningSummary(user.id);
    } else {
      await cancelMorningSummary(user.id);
    }

    return NextResponse.json(setting);
  } catch (err) {
    return errorResponse(err);
  }
}
