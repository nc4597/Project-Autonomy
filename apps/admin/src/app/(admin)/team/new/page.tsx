import { TeamMemberForm } from "@/components/TeamMemberForm";

export default function NewTeamMemberPage() {
  return (
    <div>
      <h1 className="mb-8 font-serif text-3xl text-ink">Add Team Member</h1>
      <TeamMemberForm mode="create" />
    </div>
  );
}
