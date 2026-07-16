import { NextRequest, NextResponse } from "next/server";
import { createTeamMember, listTeamMembers } from "@/lib/teamRepository";
import { teamMemberInputSchema } from "@/lib/teamSchema";

export const dynamic = "force-dynamic";

export async function GET() {
  const teamMembers = await listTeamMembers();
  return NextResponse.json({ teamMembers });
}

export async function POST(request: NextRequest) {
  const parsed = teamMemberInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const teamMember = await createTeamMember(parsed.data);
  return NextResponse.json({ teamMember }, { status: 201 });
}
