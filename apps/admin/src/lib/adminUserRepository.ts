import { prisma } from "./prisma";

export function listAdminUsers() {
  return prisma.adminUser.findMany({ orderBy: { createdAt: "asc" } });
}

export function createAdminUser(email: string, name?: string) {
  return prisma.adminUser.create({
    data: { email: email.toLowerCase().trim(), name: name?.trim() || null },
  });
}

export function deleteAdminUser(id: string) {
  return prisma.adminUser.delete({ where: { id } });
}
