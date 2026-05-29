import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { errorResponse } from "@/lib/http";
import { projectSchema } from "@/lib/validators";

type Params = { params: { id: string } };

// PATCH /api/projects/:id — edita (aceita também isArchived)
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await requireUser();
    const body = await req.json();
    const data = projectSchema.partial().parse(body);
    const isArchived =
      typeof body.isArchived === "boolean" ? body.isArchived : undefined;

    const project = await prisma.project.update({
      where: { id: params.id },
      data: { ...data, isArchived },
    });
    return NextResponse.json(project);
  } catch (err) {
    return errorResponse(err);
  }
}

// DELETE /api/projects/:id — remove (cascata apaga tarefas/labels)
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await requireUser();
    await prisma.project.delete({ where: { id: params.id } });
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return errorResponse(err);
  }
}
