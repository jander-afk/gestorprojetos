import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { errorResponse } from "@/lib/http";
import { commentCreateSchema } from "@/lib/validators";

// POST /api/tasks/:id/comments — adiciona observação/comentário
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await requireUser();
    const { body } = commentCreateSchema.parse(await req.json());
    const comment = await prisma.comment.create({
      data: { taskId: params.id, body },
    });
    return NextResponse.json(comment, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
