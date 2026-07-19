import { prisma } from "./prisma";

export function listAdminUsers() {
  return prisma.adminUser.findMany({ orderBy: { createdAt: "asc" } });
}

export function createAdminUser(
  email: string,
  name?: string,
  role?: string | null,
  licenses?: string[]
) {
  return prisma.adminUser.create({
    data: {
      email: email.toLowerCase().trim(),
      name: name?.trim() || null,
      role: role || null,
      licenses: licenses ?? [],
    },
  });
}

export function updateAdminUser(
  id: string,
  data: { name?: string | null; role?: string | null; licenses?: string[] }
) {
  return prisma.adminUser.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name?.trim() || null } : {}),
      ...(data.role !== undefined ? { role: data.role || null } : {}),
      ...(data.licenses !== undefined ? { licenses: data.licenses } : {}),
    },
  });
}

export function deleteAdminUser(id: string) {
  return prisma.adminUser.delete({ where: { id } });
}
