import { NextRequest, NextResponse } from "next/server";
import {
  formConfigSchema,
  getFormConfigState,
  saveDraftFormConfig,
  validateDraftAgainstCore,
} from "@/lib/kyc/formConfig";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getFormConfigState());
}

export async function PUT(request: NextRequest) {
  const parsed = formConfigSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const coreViolation = validateDraftAgainstCore(parsed.data);
  if (coreViolation) {
    return NextResponse.json({ error: coreViolation }, { status: 400 });
  }

  await saveDraftFormConfig(parsed.data);
  return NextResponse.json(await getFormConfigState());
}
