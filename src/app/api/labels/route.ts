import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { errorResponse, HttpError } from "@/lib/http";
import { labelSchema } from "@/lib/validators";

// GET /api/labels?projectId=... — etiquetas de um projeto
export async function GET(req: NextRequest) {
  try {
    await requireUser();
    const projectId = req.nextUrl.searchParams.get("projectId");
    if (!projectId) throw new HttpError(400, "Informe projectId");
    const labels = await prisma.label.findMany({
      where: { projectId },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(labels);
  } catch (err) {
    return errorResponse(err);
  }
}

// POST /api/labels — cria etiqueta
export async function POST(req: NextRequest) {
  try {
    await requireUser();
    const data = labelSchema.parse(await req.json());
    const label = await prisma.label.create({ data });
    return NextResponse.json(label, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
