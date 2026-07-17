import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminUser, listAdminUsers } from "@/lib/adminUserRepository";

export const dynamic = "force-dynamic";

export async function GET() {
  const adminUsers = await listAdminUsers();
  return NextResponse.json({ adminUsers });
}

const bodySchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  }

  try {
    const adminUser = await createAdminUser(parsed.data.email, parsed.data.name);
    return NextResponse.json({ adminUser }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "That email is already on the list" }, { status: 409 });
  }
}
