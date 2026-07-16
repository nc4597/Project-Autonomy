import { NextRequest, NextResponse } from "next/server";
import { deleteTeamMember, getTeamMemberById, updateTeamMember } from "@/lib/teamRepository";
import { teamMemberInputSchema } from "@/lib/teamSchema";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const teamMember = await getTeamMemberById(params.id);
  if (!teamMember) {
    return NextResponse.json({ error: "Team member not found" }, { status: 404 });
  }
  return NextResponse.json({ teamMember });
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const parsed = teamMemberInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const teamMember = await updateTeamMember(params.id, parsed.data);
  return NextResponse.json({ teamMember });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  await deleteTeamMember(params.id);
  return NextResponse.json({ ok: true });
}
