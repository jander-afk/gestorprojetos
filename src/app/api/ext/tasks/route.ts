import { NextRequest, NextResponse } from "next/server";
import { Priority, TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireApiKey } from "@/lib/api-auth";
import { errorResponse, HttpError } from "@/lib/http";
import { listTasks, createTask } from "@/server/tasks/service";
import { scheduleDeadlineReminder } from "@/server/notifications/scheduler";
import { COLUMN_LABEL, statusFromInput, priorityFromInput, POSITION_GAP } from "@/lib/kanban";

// Mapeia tarefa -> resposta compacta para o conector.
function mapTask(t: any) {
  return {
    id: t.id,
    titulo: t.title,
    status: t.status,
    statusLabel: COLUMN_LABEL[t.status as TaskStatus],
    prioridade: t.priority,
    inicio: t.startDate,
    prazo: t.dueDate,
    categorias: (t.labels ?? []).map((l: any) => l.label.name),
    checklist: {
      feitos: (t.checklist ?? []).filter((c: any) => c.done).length,
      total: (t.checklist ?? []).length,
    },
    descricao: t.description,
  };
}

// GET /api/ext/tasks?status=Pendente  -> lista (opcionalmente por status)
export async function GET(req: NextRequest) {
  try {
    requireApiKey(req);
    const raw = req.nextUrl.searchParams.get("status");
    const status = raw ? statusFromInput(raw) ?? null : null;
    if (raw && !status) throw new HttpError(400, `Status inválido: ${raw}`);
    const tasks = await listTasks(status);
    return NextResponse.json(tasks.map(mapTask));
  } catch (err) {
    return errorResponse(err);
  }
}

// POST /api/ext/tasks  -> cria atividade
// body: { titulo, status?, prioridade?, descricao?, inicio?, prazo?, categoria?, checklist?[] }
export async function POST(req: NextRequest) {
  try {
    requireApiKey(req);
    const b = await req.json();
    if (!b?.titulo || typeof b.titulo !== "string") {
      throw new HttpError(400, "Campo 'titulo' é obrigatório");
    }

    const project = b.projectId
      ? await prisma.project.findUnique({ where: { id: b.projectId } })
      : await prisma.project.findFirst({ orderBy: { createdAt: "asc" } });
    if (!project) throw new HttpError(400, "Nenhum projeto encontrado");

    const status = statusFromInput(b.status) ?? TaskStatus.BACKLOG;
    const priority = priorityFromInput(b.prioridade) ?? Priority.MEDIA;

    const last = await prisma.task.findFirst({
      where: { projectId: project.id, status },
      orderBy: { position: "desc" },
      select: { position: true },
    });
    const position = last ? last.position + POSITION_GAP : POSITION_GAP;

    const checklist: string[] = Array.isArray(b.checklist) ? b.checklist : [];

    const task = await prisma.task.create({
      data: {
        projectId: project.id,
        title: b.titulo,
        description: b.descricao ?? null,
        status,
        priority,
        startDate: b.inicio ? new Date(b.inicio) : null,
        dueDate: b.prazo ? new Date(b.prazo) : null,
        position,
        labels: b.categoria
          ? {
              create: [
                {
                  label: {
                    connectOrCreate: {
                      where: { projectId_name: { projectId: project.id, name: String(b.categoria) } },
                      create: { projectId: project.id, name: String(b.categoria), color: "#574E9C" },
                    },
                  },
                },
              ],
            }
          : undefined,
        checklist: checklist.length
          ? { create: checklist.map((text, i) => ({ text: String(text), position: (i + 1) * 1000 })) }
          : undefined,
      },
      include: { labels: { include: { label: true } }, checklist: true },
    });

    await prisma.taskActivity.create({
      data: { taskId: task.id, toStatus: status, action: "CREATED_API" },
    });
    if (task.dueDate) await scheduleDeadlineReminder(task.id);

    return NextResponse.json(mapTask(task), { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
