import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { errorResponse } from "@/lib/http";
import { projectSchema } from "@/lib/validators";

// GET /api/projects — lista quadros (não arquivados por padrão)
export async function GET(req: NextRequest) {
  try {
    await requireUser();
    const includeArchived = req.nextUrl.searchParams.get("archived") === "1";
    const projects = await prisma.project.findMany({
      where: includeArchived ? {} : { isArchived: false },
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { tasks: true } } },
    });
    return NextResponse.json(projects);
  } catch (err) {
    return errorResponse(err);
  }
}

// POST /api/projects — cria quadro
export async function POST(req: NextRequest) {
  try {
    await requireUser();
    const data = projectSchema.parse(await req.json());
    const project = await prisma.project.create({ data });
    return NextResponse.json(project, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
