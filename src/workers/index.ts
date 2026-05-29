import { Worker } from "bullmq";
import { connection, NOTIFICATIONS_QUEUE, JOB } from "@/lib/queue";
import { handleStatusChange } from "./status-change";
import { handleDeadline } from "./deadline";
import { handleMorningSummary } from "./morning-summary";

// Entrypoint do processo `worker` (container separado, mesma imagem).
// Consome a fila de notificações e despacha por nome do job.

const worker = new Worker(
  NOTIFICATIONS_QUEUE,
  async (job) => {
    switch (job.name) {
      case JOB.STATUS_CHANGE:
        return handleStatusChange(job.data.logId);
      case JOB.DEADLINE:
        return handleDeadline(job.data.logId);
      case JOB.MORNING_SUMMARY:
        return handleMorningSummary(job.data.userId);
      default:
        console.warn(`[worker] job desconhecido: ${job.name}`);
    }
  },
  { connection, concurrency: 5 },
);

worker.on("completed", (job) =>
  console.log(`[worker] ok: ${job.name} (${job.id})`),
);
worker.on("failed", (job, err) =>
  console.error(`[worker] falhou: ${job?.name} (${job?.id}) -> ${err?.message}`),
);

console.log("[worker] processador de notificações no ar");

async function shutdown() {
  console.log("[worker] encerrando…");
  await worker.close();
  process.exit(0);
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
