import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { errorResponse, HttpError } from "@/lib/http";
import { createTaskSchema } from "@/lib/validators";
import {
  getBoard,
  getFocusToday,
  getTasksByDueRange,
  createTask,
} from "@/server/tasks/service";

// GET /api/tasks
//   ?view=today                     -> coluna Foco de Hoje
//   ?start=ISO&end=ISO              -> tarefas por prazo (semana/mês)
//   ?projectId=...                  -> quadro completo do projeto
export async function GET(req: NextRequest) {
  try {
    await requireUser();
    const sp = req.nextUrl.searchParams;

    if (sp.get("view") === "today") {
      return NextResponse.json(await getFocusToday());
    }

    const start = sp.get("start");
    const end = sp.get("end");
    if (start && end) {
      return NextResponse.json(
        await getTasksByDueRange(new Date(start), new Date(end)),
      );
    }

    const projectId = sp.get("projectId");
    if (!projectId) {
      throw new HttpError(400, "Informe projectId, view=today ou start/end");
    }
    return NextResponse.json(await getBoard(projectId));
  } catch (err) {
    return errorResponse(err);
  }
}

// POST /api/tasks — cria tarefa
export async function POST(req: NextRequest) {
  try {
    await requireUser();
    const data = createTaskSchema.parse(await req.json());
    const task = await createTask(data);
    return NextResponse.json(task, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
