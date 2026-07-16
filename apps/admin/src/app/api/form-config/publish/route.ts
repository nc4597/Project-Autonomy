import { NextResponse } from "next/server";
import { getFormConfigState, publishFormConfig } from "@/lib/kyc/formConfig";

export const dynamic = "force-dynamic";

export async function POST() {
  await publishFormConfig();
  return NextResponse.json(await getFormConfigState());
}
