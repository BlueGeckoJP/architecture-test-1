import { PrismaClient } from "@/app/generated/prisma/client";

const defaultDatabaseUrl =
  "mongodb://localhost:27017/architecture_test_1?replicaSet=rs0&directConnection=true";

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = defaultDatabaseUrl;
}

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
