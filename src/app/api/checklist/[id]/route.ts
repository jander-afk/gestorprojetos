import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { errorResponse } from "@/lib/http";
import { checklistItemUpdateSchema } from "@/lib/validators";

type Params = { params: { id: string } };

// PATCH /api/checklist/:id — marca/desmarca ou edita texto
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await requireUser();
    const data = checklistItemUpdateSchema.parse(await req.json());
    const item = await prisma.checklistItem.update({
      where: { id: params.id },
      data,
    });
    return NextResponse.json(item);
  } catch (err) {
    return errorResponse(err);
  }
}

// DELETE /api/checklist/:id
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await requireUser();
    await prisma.checklistItem.delete({ where: { id: params.id } });
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return errorResponse(err);
  }
}
