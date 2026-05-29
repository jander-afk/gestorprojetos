import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { errorResponse } from "@/lib/http";
import { moveTaskSchema } from "@/lib/validators";
import { moveTask } from "@/server/tasks/service";

// PATCH /api/tasks/:id/move
// Body: { status, beforeId?, afterId? }
// Muda a coluna e/ou reordena. O servidor calcula a position a partir
// dos vizinhos e dispara as notificações de gargalo/sucesso quando aplicável.
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await requireUser();
    const data = moveTaskSchema.parse(await req.json());
    return NextResponse.json(await moveTask(params.id, data));
  } catch (err) {
    return errorResponse(err);
  }
}
