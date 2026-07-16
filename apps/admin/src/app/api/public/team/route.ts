import { NextResponse } from "next/server";
import { listTeamMembers } from "@/lib/teamRepository";

export const dynamic = "force-dynamic";

export async function GET() {
  const teamMembers = await listTeamMembers();
  return NextResponse.json({ teamMembers });
}
