import Link from "next/link";
import { listTeamMembers } from "@/lib/teamRepository";
import { DeleteTeamMemberButton } from "@/components/DeleteTeamMemberButton";

export const dynamic = "force-dynamic";

export default async function TeamListPage() {
  const teamMembers = await listTeamMembers();

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-serif text-3xl text-ink">Team</h1>
        <Link
          href="/team/new"
          className="bg-brand-red px-6 py-3 text-xs font-semibold uppercase tracking-wide text-white hover:bg-brand-red-dark"
        >
          + Add Team Member
        </Link>
      </div>

      <div className="border border-hairline bg-card">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-hairline text-xs font-semibold uppercase tracking-wide text-ink-secondary">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {teamMembers.map((member) => (
              <tr key={member.id} className="border-b border-hairline last:border-0">
                <td className="px-4 py-3 font-medium text-ink">{member.name}</td>
                <td className="px-4 py-3 text-ink-secondary">{member.title}</td>
                <td className="px-4 py-3 text-ink-secondary">{member.sortOrder}</td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/team/${member.id}`}
                    className="mr-4 text-xs font-semibold uppercase text-navy-950 hover:underline"
                  >
                    Edit
                  </Link>
                  <DeleteTeamMemberButton teamMemberId={member.id} name={member.name} />
                </td>
              </tr>
            ))}
            {teamMembers.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-ink-secondary">
                  No team members yet. Click &ldquo;Add Team Member&rdquo; to create the first one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
