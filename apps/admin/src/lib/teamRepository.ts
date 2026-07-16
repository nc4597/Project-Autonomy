import { prisma } from "./prisma";
import type { TeamMemberInput } from "./teamSchema";

// Flat entity, no child records — unlike dealRepository.ts, plain CRUD
// is enough, no transaction/delete-and-recreate needed.
export function listTeamMembers() {
  return prisma.teamMember.findMany({ orderBy: { sortOrder: "asc" } });
}

export function getTeamMemberById(id: string) {
  return prisma.teamMember.findUnique({ where: { id } });
}

export function createTeamMember(input: TeamMemberInput) {
  return prisma.teamMember.create({ data: scalarFields(input) });
}

export function updateTeamMember(id: string, input: TeamMemberInput) {
  return prisma.teamMember.update({ where: { id }, data: scalarFields(input) });
}

export function deleteTeamMember(id: string) {
  return prisma.teamMember.delete({ where: { id } });
}

function scalarFields(input: TeamMemberInput) {
  return {
    name: input.name,
    title: input.title,
    bio: input.bio,
    photoUrl: input.photoUrl ?? null,
    sortOrder: input.sortOrder,
  };
}
