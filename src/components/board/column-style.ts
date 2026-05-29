import { TaskStatus } from "@prisma/client";

// Acento suave por coluna (cor da "bolinha" e da tag de status).
// Tons calmos para não sobrecarregar; destaque maior só em Pendente
// (gargalo) e Aprovado/Concluído (sucesso).
export const COLUMN_DOT: Record<TaskStatus, string> = {
  FOCO_HOJE: "#55BDBE", // turquesa (foco)
  BACKLOG: "#94A3B8", // cinza
  EM_ANDAMENTO: "#574E9C", // azul
  PENDENTE: "#E7632F", // laranja (atenção)
  APROVADO: "#16A34A", // verde
  EM_PRODUCAO: "#0EA5E9", // ciano
  CONCLUIDO: "#22A06B", // verde escuro
};
