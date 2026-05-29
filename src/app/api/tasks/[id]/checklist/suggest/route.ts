import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { errorResponse, HttpError } from "@/lib/http";

// GET /api/tasks/:id/checklist/suggest
// Sugere um checklist com base no título e nas categorias da tarefa.
// Heurística por palavra-chave (sem IA externa).
const TEMPLATES: { keys: string[]; items: string[] }[] = [
  {
    keys: ["arte", "design", "criativo", "peça", "peca", "banner", "tapume", "layout", "post"],
    items: ["Briefing definido", "Primeira versão criada", "Revisão interna", "Ajustes aplicados", "Aprovação da franqueadora", "Arte final exportada"],
  },
  {
    keys: ["vídeo", "video", "reels", "vsl", "gravação", "gravacao", "roteiro"],
    items: ["Roteiro aprovado", "Agenda de gravação", "Gravação concluída", "Edição", "Revisão", "Publicação"],
  },
  {
    keys: ["tráfego", "trafego", "anúncio", "anuncio", "campanha", "ads", "meta", "google"],
    items: ["Objetivo e verba definidos", "Públicos configurados", "Criativos prontos", "Campanha no ar", "Otimização (D+3)", "Relatório de resultado"],
  },
  {
    keys: ["influenc", "parceria", "permuta", "creator"],
    items: ["Lista de perfis", "Contato inicial", "Briefing enviado", "Combinação fechada", "Postagem confirmada", "Repost no perfil"],
  },
  {
    keys: ["evento", "inaugura", "abertura"],
    items: ["Lista de convidados", "Confirmações", "Logística do espaço", "Roteiro do dia", "Cobertura de mídia", "Follow-up pós-evento"],
  },
];
const DEFAULT_ITEMS = ["Planejar", "Executar", "Revisar", "Aprovar", "Concluir"];

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await requireUser();
    const task = await prisma.task.findUnique({
      where: { id: params.id },
      include: { labels: { include: { label: true } } },
    });
    if (!task) throw new HttpError(404, "Tarefa não encontrada");

    const hay = (
      task.title +
      " " +
      task.labels.map((l) => l.label.name).join(" ")
    ).toLowerCase();

    const match = TEMPLATES.find((t) => t.keys.some((k) => hay.includes(k)));
    return NextResponse.json({ suggestions: match ? match.items : DEFAULT_ITEMS });
  } catch (err) {
    return errorResponse(err);
  }
}
