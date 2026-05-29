import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { errorResponse, HttpError } from "@/lib/http";
import { updateTaskSchema } from "@/lib/validators";
import { updateTask, deleteTask } from "@/server/tasks/service";

type Params = { params: { id: string } };

// GET /api/tasks/:id
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await requireUser();
    const task = await prisma.task.findUnique({
      where: { id: params.id },
      include: {
        labels: { include: { label: true } },
        checklist: { orderBy: { position: "asc" } },
        comments: { orderBy: { createdAt: "asc" } },
        activities: { orderBy: { createdAt: "desc" }, take: 20 },
      },
    });
    if (!task) throw new HttpError(404, "Tarefa não encontrada");
    return NextResponse.json(task);
  } catch (err) {
    return errorResponse(err);
  }
}

// PATCH /api/tasks/:id — edita campos
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await requireUser();
    const data = updateTaskSchema.parse(await req.json());
    return NextResponse.json(await updateTask(params.id, data));
  } catch (err) {
    return errorResponse(err);
  }
}

// DELETE /api/tasks/:id
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await requireUser();
    await deleteTask(params.id);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return errorResponse(err);
  }
}
