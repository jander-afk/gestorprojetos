import { PrismaClient } from "@prisma/client";

// Reajusta as datas das tarefas SHU pensando como gestor de projetos:
// startDate = início da execução/produção (com lead time real)
// dueDate   = data limite para entregar PRONTA e APROVADA, antes da data-alvo
// A data-alvo (cronograma/publicação) vai como nota no topo da descrição.

const prisma = new PrismaClient();
const on = (iso: string) => new Date(iso + "T15:00:00.000Z"); // ~12:00 BRT
const fmt = (d: Date) =>
  d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

type R = { t: string; start: string; due: string; target?: string };

const ROWS: R[] = [
  { t: "Homologar JPB da Silva Consultoria como gestor de tráfego (COF)", start: "2026-05-30", due: "2026-06-06", target: "2026-06-05" },
  { t: "Definir parametrização de vouchers/descontos no AVEC com a franqueadora", start: "2026-07-15", due: "2026-07-28", target: "2026-08-01" },
  { t: "Fluxo e SLA de aprovação de materiais com a franqueadora", start: "2026-06-01", due: "2026-06-06", target: "2026-06-10" },
  { t: "Visual Merchandising obrigatório da rede (PPL Comércio)", start: "2026-08-15", due: "2026-09-05", target: "2026-09-08" },
  { t: "Base de leads para o Dia 1 (WhatsApp + CRM/AVEC)", start: "2026-06-03", due: "2026-09-12", target: "2026-09-12" },
  { t: "Tríade de chegada — 'Chegou Sua Hora, Maceió'", start: "2026-05-30", due: "2026-06-03", target: "2026-06-05" },
  { t: "Série 'Diário de Obra' (semanal)", start: "2026-06-05", due: "2026-08-29", target: "2026-08-29" },
  { t: "Carrossel 'Quem está por trás da SHU Jatiúca' (Jander e Reinaldo)", start: "2026-05-30", due: "2026-06-04", target: "2026-06-06" },
  { t: "Vídeo institucional com Gilka Mafra (âncora Fase 1)", start: "2026-06-01", due: "2026-06-10", target: "2026-06-12" },
  { t: "Ativar squad de influenciadoras (Fase 2)", start: "2026-07-20", due: "2026-08-08", target: "2026-08-13" },
  { t: "Patrocínio/apoio em provas e competições (Fase 2)", start: "2026-07-15", due: "2026-08-18", target: "2026-08-23" },
  { t: "Configurar e ativar Meta Ads — Fase 1 (R$1.700)", start: "2026-06-01", due: "2026-06-04", target: "2026-06-05" },
  { t: "Configurar e ativar Google Ads — Fase 1 (R$1.000)", start: "2026-06-03", due: "2026-06-07", target: "2026-06-08" },
  { t: "Meta Ads — Fase 2 (R$1.600)", start: "2026-07-22", due: "2026-07-30", target: "2026-08-01" },
  { t: "Google Ads — Fase 2 (R$1.200)", start: "2026-07-22", due: "2026-07-30", target: "2026-08-01" },
  { t: "OOH / Aqui Ads — mídia exterior na Jatiúca", start: "2026-07-01", due: "2026-07-15", target: "2026-07-20" },
  { t: "Release cross-over dos empreendedores (imprensa)", start: "2026-06-03", due: "2026-06-08", target: "2026-06-10" },
  { t: "PR Digital Fase 2 — pautas (marca, serviços, biossegurança)", start: "2026-07-15", due: "2026-07-29", target: "2026-08-01" },
  { t: "Release de inauguração para imprensa", start: "2026-08-24", due: "2026-09-01", target: "2026-09-02" },
  { t: "Definir e travar a data de inauguração (Dia D)", start: "2026-08-05", due: "2026-08-15", target: "2026-08-15" },
  { t: "Contratar atrações do evento (Fernanda Guimarães, Cambinda Nova, DJ, cerimonial)", start: "2026-07-13", due: "2026-07-29", target: "2026-07-29" },
  { t: "Campanha 'Contagem Regressiva' (Fase 3A)", start: "2026-08-22", due: "2026-09-11", target: "2026-09-12" },
  { t: "Produzir Press Kits dos convidados (80-120 un.)", start: "2026-08-05", due: "2026-09-01", target: "2026-09-02" },
  { t: "Lista e confirmação de convidados", start: "2026-08-20", due: "2026-09-04", target: "2026-09-05" },
  { t: "Infraestrutura do evento (som, luz, buffet, decoração, registro)", start: "2026-08-10", due: "2026-08-28", target: "2026-08-29" },
  { t: "Roteiro e cobertura do Dia D (programação 17h-22h)", start: "2026-09-05", due: "2026-09-10", target: "2026-09-10" },
  { t: "Evento de Inauguração — Dia D", start: "2026-09-12", due: "2026-09-12", target: "2026-09-12" },
  { t: "Planejar dinâmica 'Estoura Balão' (D a D+6)", start: "2026-08-17", due: "2026-09-04", target: "2026-09-05" },
  { t: "Operar 'Estoura Balão' + captação de leads (D+1 a D+6)", start: "2026-09-12", due: "2026-09-18", target: "2026-09-18" },
  { t: "Pós-inauguração imediata (Fase 3C) — feedback e conteúdo", start: "2026-09-13", due: "2026-09-18", target: "2026-09-18" },
];

async function main() {
  const project = await prisma.project.findFirst({ orderBy: { createdAt: "asc" } });
  if (!project) throw new Error("Nenhum projeto encontrado.");
  let upd = 0;
  let miss = 0;
  for (const r of ROWS) {
    const task = await prisma.task.findFirst({
      where: { projectId: project.id, title: r.t },
    });
    if (!task) {
      miss++;
      console.log("NAO ENCONTRADA:", r.t);
      continue;
    }
    let desc = (task.description ?? "").replace(/^🎯 Alvo[^\n]*\n+/, "");
    if (r.target) {
      desc = `🎯 Alvo (cronograma): ${fmt(on(r.target))} — entregar pronta e aprovada antes disso.\n\n${desc}`;
    }
    await prisma.task.update({
      where: { id: task.id },
      data: { startDate: on(r.start), dueDate: on(r.due), description: desc.trim() || null },
    });
    upd++;
  }
  console.log(`Datas reajustadas: ${upd} atualizadas, ${miss} nao encontradas.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
