import { NextResponse } from "next/server";
import { z } from "zod";
import { deleteAdminUser, updateAdminUser } from "@/lib/adminUserRepository";
import { ADMIN_ROLES, ADMIN_LICENSES } from "@/lib/adminAccess";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  name: z.string().max(120).nullable().optional(),
  role: z.enum(ADMIN_ROLES).nullable().optional(),
  licenses: z.array(z.enum(ADMIN_LICENSES)).max(ADMIN_LICENSES.length).optional(),
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update" }, { status: 400 });
  }
  const adminUser = await updateAdminUser(params.id, parsed.data);
  return NextResponse.json({ adminUser });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  await deleteAdminUser(params.id);
  return NextResponse.json({ ok: true });
}
