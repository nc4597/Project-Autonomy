import { PrismaClient } from "@prisma/client";

// Next.js dev-mode hot-reloading re-evaluates this module on every file
// change; without stashing the client on `global`, each reload would
// open a fresh PrismaClient (and a fresh pool of DB connections) on top
// of the last one until the connection limit is exhausted.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
