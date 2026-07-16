import { notFound } from "next/navigation";
import { getTeamMemberById } from "@/lib/teamRepository";
import { TeamMemberForm, type TeamMemberFormValues } from "@/components/TeamMemberForm";

export const dynamic = "force-dynamic";

export default async function EditTeamMemberPage({ params }: { params: { id: string } }) {
  const teamMember = await getTeamMemberById(params.id);
  if (!teamMember) notFound();

  const initialValues: TeamMemberFormValues = {
    name: teamMember.name,
    title: teamMember.title,
    bio: teamMember.bio,
    photoUrl: teamMember.photoUrl,
    sortOrder: teamMember.sortOrder,
  };

  return (
    <div>
      <h1 className="mb-8 font-serif text-3xl text-ink">Edit Team Member</h1>
      <TeamMemberForm mode="edit" teamMemberId={teamMember.id} initialValues={initialValues} />
    </div>
  );
}
