import { z } from "zod";
import { TaskStatus, Priority } from "@prisma/client";

// Schemas Zod dos payloads das rotas. Centralizar aqui evita validação
// espalhada e dá mensagens de erro consistentes.

const statusEnum = z.nativeEnum(TaskStatus);
const priorityEnum = z.nativeEnum(Priority);

// Aceita ISO string ou null; transforma em Date | null.
const dateField = z
  .union([z.string().datetime({ offset: true }), z.null()])
  .transform((v) => (v ? new Date(v) : null));

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Título é obrigatório").max(200),
  description: z.string().max(5000).optional(),
  projectId: z.string().cuid(),
  status: statusEnum.optional(),
  priority: priorityEnum.optional(),
  startDate: dateField.optional(),
  dueDate: dateField.optional(),
  labelIds: z.array(z.string().cuid()).optional(),
});

export const updateTaskSchema = createTaskSchema
  .partial()
  .omit({ projectId: true });

// Movimentação no quadro: muda de coluna e/ou reordena.
// O cliente envia os vizinhos (antes/depois) no destino; o servidor calcula
// a position. Mais robusto do que mandar a position já calculada.
export const moveTaskSchema = z.object({
  status: statusEnum,
  beforeId: z.string().cuid().nullable().optional(),
  afterId: z.string().cuid().nullable().optional(),
});

export const projectSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().max(2000).optional(),
  color: z
    .string()
    .regex(/^#([0-9a-fA-F]{6})$/, "Cor deve ser hex #RRGGBB")
    .optional(),
});

export const labelSchema = z.object({
  name: z.string().trim().min(1).max(40),
  color: z.string().regex(/^#([0-9a-fA-F]{6})$/).optional(),
  projectId: z.string().cuid(),
});

export const notificationSettingsSchema = z.object({
  enabled: z.boolean().optional(),
  whatsappNumberOverride: z
    .string()
    .regex(/^\d{10,15}$/, "Número em E.164 sem '+' (ex.: 5582999999999)")
    .nullable()
    .optional(),
  resumoMatinalEnabled: z.boolean().optional(),
  resumoMatinalTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Horário no formato HH:mm")
    .optional(),
  alertaGargaloEnabled: z.boolean().optional(),
  alertaSucessoEnabled: z.boolean().optional(),
  lembretePrazoEnabled: z.boolean().optional(),
  lembretePrazoMinutos: z.number().int().min(5).max(1440).optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type MoveTaskInput = z.infer<typeof moveTaskSchema>;
export type NotificationSettingsInput = z.infer<
  typeof notificationSettingsSchema
>;
