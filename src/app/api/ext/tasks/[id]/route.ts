import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiKey } from "@/lib/api-auth";
import { errorResponse, HttpError } from "@/lib/http";
import { updateTask } from "@/server/tasks/service";
import { COLUMN_LABEL, statusFromInput, priorityFromInput } from "@/lib/kanban";
import type { TaskStatus } from "@prisma/client";

// PATCH /api/ext/tasks/:id  -> atualiza atividade
// body: { titulo?, descricao?, status?, prioridade?, inicio?, prazo?, checklist?[] (adiciona itens) }
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    requireApiKey(req);
    const b = await req.json();

    const status = b.status != null ? statusFromInput(b.status) : undefined;
    if (b.status != null && !status) throw new HttpError(400, `Status inválido: ${b.status}`);
    const priority = b.prioridade != null ? priorityFromInput(b.prioridade) : undefined;
    if (b.prioridade != null && !priority) throw new HttpError(400, `Prioridade inválida: ${b.prioridade}`);

    await updateTask(params.id, {
      title: typeof b.titulo === "string" ? b.titulo : undefined,
      description: typeof b.descricao === "string" ? b.descricao : undefined,
      status,
      priority,
      startDate: b.inicio !== undefined ? (b.inicio ? new Date(b.inicio) : null) : undefined,
      dueDate: b.prazo !== undefined ? (b.prazo ? new Date(b.prazo) : null) : undefined,
    });

    // itens de checklist adicionais
    if (Array.isArray(b.checklist) && b.checklist.length) {
      const last = await prisma.checklistItem.findFirst({
        where: { taskId: params.id },
        orderBy: { position: "desc" },
        select: { position: true },
      });
      let pos = (last?.position ?? 0) + 1000;
      for (const text of b.checklist) {
        await prisma.checklistItem.create({ data: { taskId: params.id, text: String(text), position: pos } });
        pos += 1000;
      }
    }

    const task = await prisma.task.findUnique({
      where: { id: params.id },
      include: { labels: { include: { label: true } }, checklist: true },
    });
    if (!task) throw new HttpError(404, "Tarefa não encontrada");

    return NextResponse.json({
      id: task.id,
      titulo: task.title,
      status: task.status,
      statusLabel: COLUMN_LABEL[task.status as TaskStatus],
      prioridade: task.priority,
      prazo: task.dueDate,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
