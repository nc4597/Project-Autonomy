import { NextResponse } from "next/server";
import { deleteAdminUser } from "@/lib/adminUserRepository";

export const dynamic = "force-dynamic";

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  await deleteAdminUser(params.id);
  return NextResponse.json({ ok: true });
}
