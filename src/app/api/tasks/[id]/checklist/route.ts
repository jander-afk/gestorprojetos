import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { errorResponse } from "@/lib/http";
import { checklistItemCreateSchema } from "@/lib/validators";

// POST /api/tasks/:id/checklist — adiciona item ao checklist
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await requireUser();
    const { text } = checklistItemCreateSchema.parse(await req.json());
    const last = await prisma.checklistItem.findFirst({
      where: { taskId: params.id },
      orderBy: { position: "desc" },
      select: { position: true },
    });
    const position = last ? last.position + 1000 : 1000;
    const item = await prisma.checklistItem.create({
      data: { taskId: params.id, text, position },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
