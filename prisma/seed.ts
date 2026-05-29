import { PrismaClient, TaskStatus, Priority } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Cria o gestor (single-user), o primeiro quadro, etiquetas e
// algumas tarefas de exemplo. Credenciais vêm do .env ou usam o default.
async function main() {
  const email = (process.env.SEED_EMAIL ?? "gestor@suahoraunha.com.br").toLowerCase();
  const password = process.env.SEED_PASSWORD ?? "mudar@123";
  const tz = process.env.APP_DEFAULT_TIMEZONE ?? "America/Maceio";

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: "Gestor SHU",
      passwordHash: await bcrypt.hash(password, 10),
      timezone: tz,
      whatsappNumber: process.env.SEED_WHATSAPP ?? null,
      notificationSetting: { create: {} },
    },
  });

  // Quadro só é criado se ainda não houver nenhum.
  const count = await prisma.project.count();
  if (count === 0) {
    const project = await prisma.project.create({
      data: {
        name: "Lançamento SHU Jatiúca",
        description: "Quadro de produção do lançamento.",
        color: "#55BDBE",
        labels: {
          create: [
            { name: "Tráfego", color: "#574E9C" },
            { name: "Conteúdo", color: "#55BDBE" },
            { name: "Urgente", color: "#E7632F" },
          ],
        },
      },
    });

    await prisma.task.createMany({
      data: [
        {
          title: "Aprovar arte do tapume com a franqueadora",
          projectId: project.id,
          status: TaskStatus.FOCO_HOJE,
          priority: Priority.ALTA,
          position: 1000,
        },
        {
          title: "Confirmar lista de influenciadoras",
          projectId: project.id,
          status: TaskStatus.FOCO_HOJE,
          priority: Priority.MEDIA,
          position: 2000,
        },
        {
          title: "Briefing do vídeo de bastidores",
          projectId: project.id,
          status: TaskStatus.BACKLOG,
          priority: Priority.MEDIA,
          position: 1000,
        },
      ],
    });
  }

  console.log("Seed concluído.");
  console.log(`Login: ${email}  |  Senha: ${password}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
