import { PrismaClient } from "@prisma/client";

// Singleton do PrismaClient.
// Em dev, o hot-reload do Next recria módulos e abriria conexões demais;
// guardamos a instância no globalThis para reaproveitar.

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
