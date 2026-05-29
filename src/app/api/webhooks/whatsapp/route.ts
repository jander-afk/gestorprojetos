import { NextRequest, NextResponse } from "next/server";
import { NotificationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// Webhook da Meta Cloud API.
// GET  -> verificação (challenge) na configuração do webhook.
// POST -> callbacks de status de entrega (sent/delivered/read/failed).

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const mode = sp.get("hub.mode");
  const token = sp.get("hub.verify_token");
  const challenge = sp.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge ?? "", { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

type MetaStatus = { id: string; status: string; errors?: { title?: string }[] };

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const statuses: MetaStatus[] =
      body?.entry?.flatMap(
        (e: any) =>
          e?.changes?.flatMap((c: any) => c?.value?.statuses ?? []) ?? [],
      ) ?? [];

    for (const s of statuses) {
      if (!s.id) continue;
      // só rebaixa para FALHOU; entregue/lido mantém ENVIADA
      const failed = s.status === "failed";
      await prisma.notificationLog.updateMany({
        where: { wamid: s.id },
        data: failed
          ? {
              status: NotificationStatus.FALHOU,
              error: s.errors?.[0]?.title ?? "failed",
            }
          : { sentAt: { set: new Date() } },
      });
    }
  } catch (err) {
    console.error("[webhook whatsapp] erro:", err);
  }
  // Sempre 200 rápido para a Meta não reenfileirar.
  return NextResponse.json({ received: true });
}
