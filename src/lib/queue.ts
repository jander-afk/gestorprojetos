import { Queue } from "bullmq";
import IORedis from "ioredis";

// Conexão única com o Redis e a fila de notificações.
// IMPORTANTE: maxRetriesPerRequest deve ser null para o BullMQ.

const globalForQueue = globalThis as unknown as {
  connection?: IORedis;
  notificationsQueue?: Queue;
};

export const connection =
  globalForQueue.connection ??
  new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
    maxRetriesPerRequest: null,
  });

// Nome da fila e dos jobs (usados por dispatcher/scheduler e pelo worker).
export const NOTIFICATIONS_QUEUE = "notifications";

export const JOB = {
  STATUS_CHANGE: "status-change", // gargalo / sucesso (imediato)
  MORNING_SUMMARY: "morning-summary", // repetível por usuário (08:00)
  DEADLINE: "deadline", // delayed, T-2h antes da dueDate
} as const;

export type JobName = (typeof JOB)[keyof typeof JOB];

export const notificationsQueue =
  globalForQueue.notificationsQueue ??
  new Queue(NOTIFICATIONS_QUEUE, {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
      removeOnComplete: { age: 60 * 60 * 24 * 7 }, // guarda 7 dias
      removeOnFail: { age: 60 * 60 * 24 * 30 },
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForQueue.connection = connection;
  globalForQueue.notificationsQueue = notificationsQueue;
}

// jobId determinístico do lembrete de prazo -> permite cancelar/reagendar.
export const deadlineJobId = (taskId: string) => `deadline:${taskId}`;

// jobId do resumo matinal repetível, por usuário.
export const morningJobId = (userId: string) => `morning:${userId}`;
