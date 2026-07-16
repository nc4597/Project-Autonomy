import { getPublishedFormConfig } from "@/lib/kyc/formConfig";
import { corsPreflight, jsonWithCors } from "@/lib/kyc/cors";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return corsPreflight();
}

// Unauthenticated: the investor wizard fetches this to render the form.
export async function GET() {
  return jsonWithCors(await getPublishedFormConfig());
}
