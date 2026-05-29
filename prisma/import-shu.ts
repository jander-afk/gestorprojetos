import { PrismaClient, TaskStatus, Priority } from "@prisma/client";

// Importa o projeto de lançamento da SHU Jatiúca como tarefas (entregáveis).
// Data D (inauguração) estimada: 12/09/2026 — pode antecipar para 29/08.
// Idempotente: pula tarefas cujo título já exista no projeto.

const prisma = new PrismaClient();
const D = new Date("2026-09-12T15:00:00.000Z"); // ~12:00 BRT
const DAY = 86400000;
const dB = (n: number) => new Date(D.getTime() - n * DAY);
const dA = (n: number) => new Date(D.getTime() + n * DAY);
const on = (iso: string) => new Date(iso + "T15:00:00.000Z");

const CATS = [
  "Branding & Identidade",
  "Conteúdo & Social",
  "Tráfego Pago",
  "Influência",
  "Imprensa & PR",
  "Evento",
  "Dinâmica (Estoura Balão)",
  "Operação & Compliance",
];
const COLOR: Record<string, string> = {
  "Branding & Identidade": "#574E9C",
  "Conteúdo & Social": "#55BDBE",
  "Tráfego Pago": "#E7632F",
  "Influência": "#D6409F",
  "Imprensa & PR": "#0EA5E9",
  "Evento": "#16A34A",
  "Dinâmica (Estoura Balão)": "#F59E0B",
  "Operação & Compliance": "#64748B",
};

type T = {
  title: string;
  cat: string;
  priority: Priority;
  start?: Date;
  due?: Date;
  desc?: string;
  checklist: string[];
};

const TASKS: T[] = [
  // ---- Operação & Compliance (bloqueadores / contínuos) ----
  {
    title: "Homologar JPB da Silva Consultoria como gestor de tráfego (COF)",
    cat: "Operação & Compliance",
    priority: Priority.URGENTE,
    start: on("2026-06-01"),
    due: on("2026-06-05"),
    desc: "Bloqueador: sem homologação na COF, as campanhas de tráfego pago não sobem.",
    checklist: [
      "Reunir documentação exigida pela COF",
      "Enviar pedido de homologação",
      "Acompanhar aprovação",
      "Confirmar acesso aos gerenciadores (Meta/Google)",
    ],
  },
  {
    title: "Definir parametrização de vouchers/descontos no AVEC com a franqueadora",
    cat: "Operação & Compliance",
    priority: Priority.ALTA,
    start: on("2026-07-01"),
    due: on("2026-08-01"),
    desc: "AVEC só permite operar vouchers/descontos parametrizados pela franqueadora. Definir antes da Fase 3.",
    checklist: [
      "Levantar opções com a franqueadora",
      "Escolher: voucher parametrizado / experiência inaugural / desconto aprovado",
      "Parametrizar no AVEC",
      "Validar compliance",
    ],
  },
  {
    title: "Fluxo e SLA de aprovação de materiais com a franqueadora",
    cat: "Operação & Compliance",
    priority: Priority.MEDIA,
    start: on("2026-06-01"),
    due: on("2026-06-10"),
    desc: "Toda peça de comunicação exige aprovação prévia da franqueadora antes de veicular.",
    checklist: [
      "Definir canal de aprovação",
      "Acordar prazo de retorno (SLA)",
      "Criar checklist de submissão",
    ],
  },
  {
    title: "Visual Merchandising obrigatório da rede (PPL Comércio)",
    cat: "Operação & Compliance",
    priority: Priority.ALTA,
    due: dB(7),
    desc: "Itens de VM e estoque inaugural obrigatórios da rede (PPL).",
    checklist: [
      "Conferir lista obrigatória de VM",
      "Pedido PPL (chinelo, esmalte, blend cream, adesivos, vale-presente)",
      "Placas e backdrops para fotos (8 un.)",
      "Conferência na loja",
    ],
  },
  {
    title: "Base de leads para o Dia 1 (WhatsApp + CRM/AVEC)",
    cat: "Operação & Compliance",
    priority: Priority.ALTA,
    start: on("2026-06-03"),
    due: D,
    desc: "Meta-âncora: 500 contatos qualificados até a inauguração.",
    checklist: [
      "Configurar lista de espera / captação",
      "Integração com AVEC",
      "Captação contínua via campanhas e conteúdo",
      "Acompanhar meta (500 leads)",
    ],
  },
  // ---- Branding / Conteúdo Fase 1 ----
  {
    title: "Tríade de chegada — 'Chegou Sua Hora, Maceió'",
    cat: "Conteúdo & Social",
    priority: Priority.ALTA,
    start: on("2026-06-01"),
    due: on("2026-06-05"),
    desc: "3 peças encadeadas de chegada (manifesto, cidade, diário de obra) + stories de apoio.",
    checklist: [
      "Peça 1 — 'Chegou Sua Hora' (pictograma relógio)",
      "Peça 2 — 'Estamos chegando' (orla/Maceió)",
      "Peça 3 — Reel Diário de Obra #1",
      "Stories de apoio de cada peça",
      "Aprovação da franqueadora",
    ],
  },
  {
    title: "Série 'Diário de Obra' (semanal)",
    cat: "Conteúdo & Social",
    priority: Priority.MEDIA,
    start: on("2026-06-05"),
    due: dB(14),
    desc: "Reel/stories semanais mostrando a evolução da obra até ~15 dias antes do D.",
    checklist: [
      "Episódio 1 (apresentação sócios + engenheiro)",
      "Episódios 2 a 6 (evolução)",
      "Episódio final (obra concluída)",
      "Captação interna recorrente",
      "Aprovação da franqueadora",
    ],
  },
  {
    title: "Carrossel 'Quem está por trás da SHU Jatiúca' (Jander e Reinaldo)",
    cat: "Conteúdo & Social",
    priority: Priority.MEDIA,
    start: on("2026-06-02"),
    due: on("2026-06-06"),
    checklist: ["Roteiro (6 slides)", "Captação de fotos dos sócios", "Diagramação", "Aprovação", "Publicação"],
  },
  // ---- Influência ----
  {
    title: "Vídeo institucional com Gilka Mafra (âncora Fase 1)",
    cat: "Influência",
    priority: Priority.ALTA,
    start: on("2026-06-02"),
    due: on("2026-06-12"),
    desc: "Reel 60-90s + stories + post fixado no perfil dela. Ação principal da Fase 1.",
    checklist: [
      "Fechar contrato Gilka Mafra (pacote + 3 meses)",
      "Briefing aprovado pela franqueadora",
      "Receber material",
      "Publicar e fixar no perfil dela",
      "Repost no perfil da unidade",
      "Corte ressignificado para reapresentação",
    ],
  },
  {
    title: "Ativar squad de influenciadoras (Fase 2)",
    cat: "Influência",
    priority: Priority.ALTA,
    start: on("2026-07-01"),
    due: dB(30),
    desc: "Squad: Gilka, Judith, Jacyane, Júlia, Raphaela, Bruna, James + complementares.",
    checklist: [
      "Lista e curadoria de perfis",
      "Contato e negociação (cachê/permuta)",
      "Briefing por perfil",
      "Agenda de postagens (com data quando definida)",
      "Confirmar presença no evento",
    ],
  },
  {
    title: "Patrocínio/apoio em provas e competições (Fase 2)",
    cat: "Influência",
    priority: Priority.BAIXA,
    start: on("2026-07-15"),
    due: dB(20),
    checklist: ["Mapear eventos esportivos", "Definir formato de apoio", "Produzir material de marca", "Ativação"],
  },
  // ---- Tráfego Pago ----
  {
    title: "Configurar e ativar Meta Ads — Fase 1 (R$1.700)",
    cat: "Tráfego Pago",
    priority: Priority.ALTA,
    start: on("2026-06-03"),
    due: on("2026-06-05"),
    desc: "3 campanhas: Awareness 'SHU Chegou' R$600 + Engajamento 'Diário de Obra' R$400 + Contratação R$700 (3 semanas).",
    checklist: [
      "Setup conta de anúncios",
      "Pixel + API de Conversões",
      "Criar 3 campanhas com segmentação isolada",
      "Subir criativos (tríade)",
      "Ativar (após homologação COF)",
      "Otimização D+3",
    ],
  },
  {
    title: "Configurar e ativar Google Ads — Fase 1 (R$1.000)",
    cat: "Tráfego Pago",
    priority: Priority.MEDIA,
    start: on("2026-06-04"),
    due: on("2026-06-08"),
    desc: "2 campanhas: Search + Display.",
    checklist: ["Setup conta", "Campanha Search (palavras-chave)", "Campanha Display", "Conversões", "Ativar"],
  },
  {
    title: "Meta Ads — Fase 2 (R$1.600)",
    cat: "Tráfego Pago",
    priority: Priority.ALTA,
    start: on("2026-07-15"),
    due: on("2026-08-01"),
    desc: "2 campanhas (retargeting de quem engajou na Fase 1 + nova audiência).",
    checklist: ["Definir públicos (incl. lookalike)", "Criativos Fase 2", "Subir campanhas", "Acompanhar (30-50 mil impressões)"],
  },
  {
    title: "Google Ads — Fase 2 (R$1.200)",
    cat: "Tráfego Pago",
    priority: Priority.MEDIA,
    start: on("2026-07-15"),
    due: on("2026-08-01"),
    desc: "Search ('inauguração esmalteria maceió', 'unha inauguração') + reforço.",
    checklist: ["Palavras-chave de inauguração", "Anúncios Search", "Display de reforço", "Acompanhar (800-1.500 cliques)"],
  },
  {
    title: "OOH / Aqui Ads — mídia exterior na Jatiúca",
    cat: "Tráfego Pago",
    priority: Priority.MEDIA,
    start: on("2026-07-01"),
    due: on("2026-07-20"),
    checklist: ["Cotação Aqui Ads", "Definir pontos no raio de influência", "Arte aprovada pela franqueadora", "Veiculação"],
  },
  // ---- Imprensa & PR ----
  {
    title: "Release cross-over dos empreendedores (imprensa)",
    cat: "Imprensa & PR",
    priority: Priority.MEDIA,
    start: on("2026-06-03"),
    due: on("2026-06-10"),
    desc: "Foco nos sócios como empreendedores. Veículos: S.Mag, Alagoana, Arretada, Evidência.",
    checklist: ["Redigir release", "Anexar tríade visual", "Disparar para veículos", "Follow-up", "Nota em coluna social (Gigi Accioly)"],
  },
  {
    title: "PR Digital Fase 2 — pautas (marca, serviços, biossegurança)",
    cat: "Imprensa & PR",
    priority: Priority.MEDIA,
    start: on("2026-07-10"),
    due: on("2026-08-01"),
    checklist: ["Definir ângulos de pauta", "Sugestões de pauta aos veículos", "Acompanhar publicações (meta: 4+)"],
  },
  {
    title: "Release de inauguração para imprensa",
    cat: "Imprensa & PR",
    priority: Priority.ALTA,
    due: dB(10),
    desc: "Disparar ~10 dias antes do D. Foco: empregos, modelo sem agendamento, biossegurança.",
    checklist: [
      "Redigir release de inauguração",
      "Disparar para todas as redações mapeadas",
      "Agendar cobertura",
      "Acionar IsaBelle Accioly (cobertura jornalística/social)",
    ],
  },
  // ---- Fase 3 — pré-inauguração / evento ----
  {
    title: "Definir e travar a data de inauguração (Dia D)",
    cat: "Operação & Compliance",
    priority: Priority.URGENTE,
    due: dB(28),
    desc: "Estimativa atual: 12/09 (pode antecipar para 29/08). Confirmar com escritório de obra quando faltar ~15 dias.",
    checklist: [
      "Obter cronograma de obra atualizado",
      "Confirmar data com 15 dias de antecedência",
      "Decidir 12/09 x antecipação 29/08",
      "Comunicar equipe, fornecedores e atrações",
    ],
  },
  {
    title: "Contratar atrações do evento (Fernanda Guimarães, Cambinda Nova, DJ, cerimonial)",
    cat: "Evento",
    priority: Priority.URGENTE,
    due: dB(45),
    desc: "Fernanda Guimarães exige antecedência mínima de 45 dias.",
    checklist: [
      "Negociar show Fernanda Guimarães (1h)",
      "Contratar Cambinda Nova de Alagoas (30 min)",
      "Contratar DJ (set 4h)",
      "Contratar cerimonial / mestre de cerimônia",
    ],
  },
  {
    title: "Campanha 'Contagem Regressiva' (Fase 3A)",
    cat: "Conteúdo & Social",
    priority: Priority.ALTA,
    start: dB(15),
    due: D,
    desc: "Marcos de 15, 7 e 1 dia antes do Dia D. Gerar ativações de lembrete.",
    checklist: ["Conceito da contagem", "Marco D-15", "Marco D-7", "Marco D-1", "Stories diários + ativar lembrete", "Influenciadoras com a data concreta"],
  },
  {
    title: "Produzir Press Kits dos convidados (80-120 un.)",
    cat: "Evento",
    priority: Priority.ALTA,
    due: dB(10),
    desc: "Convite em formato press kit (itens PPL + personalizados).",
    checklist: [
      "Caixa personalizada + convite impresso (gráfica local)",
      "Itens PPL (chinelo, esmalte, blend cream, adesivos)",
      "Voucher 'Primeira Experiência SHU'",
      "Squeeze + necessaire personalizados",
      "Montagem dos kits",
      "Envio aos convidados",
    ],
  },
  {
    title: "Lista e confirmação de convidados",
    cat: "Evento",
    priority: Priority.ALTA,
    due: dB(7),
    desc: "VIPs, influenciadoras, imprensa, parceiros comerciais + buffer.",
    checklist: [
      "Influenciadoras do squad",
      "Imprensa e colunistas",
      "Parceiros comerciais (hotéis, clínicas, academias, lojas)",
      "Convidados VIP (rede de Jander e Reinaldo)",
      "RSVP e buffer de última hora",
    ],
  },
  {
    title: "Infraestrutura do evento (som, luz, buffet, decoração, registro)",
    cat: "Evento",
    priority: Priority.ALTA,
    due: dB(14),
    checklist: [
      "Som e iluminação cênica",
      "Buffet / coquetel + estação de espumante",
      "Decoração (flores, balões, backdrops)",
      "Fotógrafo (4h) + videomaker",
      "Segurança (controle de acesso)",
    ],
  },
  {
    title: "Roteiro e cobertura do Dia D (programação 17h-22h)",
    cat: "Evento",
    priority: Priority.ALTA,
    due: dB(2),
    checklist: [
      "Roteiro do cerimonial (17h-22h)",
      "Briefing social media (stories ao vivo / Reels)",
      "Briefing influenciadoras presentes",
      "Checklist de montagem 15h-17h",
    ],
  },
  {
    title: "Evento de Inauguração — Dia D",
    cat: "Evento",
    priority: Priority.URGENTE,
    start: D,
    due: D,
    desc: "Sábado, 17h-22h. Estimado 12/09 (pode antecipar p/ 29/08).",
    checklist: [
      "Montagem e testes (15h-17h)",
      "Abertura + welcome drink (17h)",
      "Apresentação institucional dos sócios (18h)",
      "Maracatu Cambinda Nova (18h20)",
      "Sorteio de vouchers/vale-presentes (18h50)",
      "Show Fernanda Guimarães (19h)",
      "Encerramento (22h)",
    ],
  },
  // ---- Dinâmica Estoura Balão (Fase 3C) ----
  {
    title: "Planejar dinâmica 'Estoura Balão' (D a D+6)",
    cat: "Dinâmica (Estoura Balão)",
    priority: Priority.ALTA,
    due: dB(7),
    desc: "Ativação presencial com totem de balões, sorteio puro + kit consolação universal.",
    checklist: [
      "Regulamento (16+, aceite LGPD via QR)",
      "Mecânica: sorteio puro + kit consolação (brinde + voucher AVEC)",
      "Quadro de prêmios + compliance AVEC",
      "Totem + QR code + paleta (Turquesa/Azul/Laranja)",
      "Fluxo do cliente + janelas de horário",
      "Plano editorial dia a dia",
      "Fornecedores (balões, totem, brindes)",
    ],
  },
  {
    title: "Operar 'Estoura Balão' + captação de leads (D+1 a D+6)",
    cat: "Dinâmica (Estoura Balão)",
    priority: Priority.ALTA,
    start: dA(1),
    due: dA(6),
    desc: "Cadastro obrigatório via QR/AVEC antes do estouro. Meta ~14 participantes/dia (~100 leads).",
    checklist: [
      "Cadastro QR/AVEC (nome, nascimento, telefone) + LGPD",
      "Operação diária do totem",
      "Sócios em pelo menos uma janela",
      "Gerar UGC diário e repostar",
      "Acompanhar meta de leads",
    ],
  },
  {
    title: "Pós-inauguração imediata (Fase 3C) — feedback e conteúdo",
    cat: "Conteúdo & Social",
    priority: Priority.MEDIA,
    start: dA(1),
    due: dA(6),
    desc: "Material captado alimenta no mínimo 30 dias de conteúdo.",
    checklist: [
      "Mensagem de feedback via WhatsApp (24-48h)",
      "Publicar material captado na inauguração",
      "Vídeo institucional 2-3 min",
      "Cortes dos shows + depoimentos",
      "Planejar 30 dias de conteúdo",
    ],
  },
];

async function main() {
  const project = await prisma.project.findFirst({ orderBy: { createdAt: "asc" } });
  if (!project) throw new Error("Nenhum projeto encontrado. Rode o seed antes.");

  const labelId: Record<string, string> = {};
  for (const c of CATS) {
    const l = await prisma.label.upsert({
      where: { projectId_name: { projectId: project.id, name: c } },
      update: {},
      create: { projectId: project.id, name: c, color: COLOR[c] },
    });
    labelId[c] = l.id;
  }

  let pos = 1000;
  let created = 0;
  let skipped = 0;
  for (const t of TASKS) {
    const exists = await prisma.task.findFirst({
      where: { projectId: project.id, title: t.title },
    });
    if (exists) {
      skipped++;
      continue;
    }
    await prisma.task.create({
      data: {
        projectId: project.id,
        title: t.title,
        description: t.desc ?? null,
        status: TaskStatus.BACKLOG,
        priority: t.priority,
        startDate: t.start ?? null,
        dueDate: t.due ?? null,
        position: pos,
        labels: { create: [{ labelId: labelId[t.cat] }] },
        checklist: {
          create: t.checklist.map((text, i) => ({ text, position: (i + 1) * 1000 })),
        },
      },
    });
    pos += 1000;
    created++;
  }
  console.log(`Import SHU concluido: ${created} tarefas criadas, ${skipped} ja existiam.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
