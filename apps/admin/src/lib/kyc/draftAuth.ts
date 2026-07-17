import { jsonWithCors } from "./cors";

/**
 * Draft access control: every submission created since keys existed
 * carries a clientSecret known only to the investor's browser (handed
 * out at creation, or re-issued through the identity-challenge unlock
 * endpoint). A request must present it in x-draft-secret to read or
 * write the draft. Null-secret submissions predate the feature and are
 * grandfathered.
 */
export function draftSecretValid(
  submission: { clientSecret: string | null },
  request: Request
): boolean {
  if (!submission.clientSecret) return true;
  return request.headers.get("x-draft-secret") === submission.clientSecret;
}

export function draftUnauthorized() {
  return jsonWithCors(
    { error: "This verification is locked. Open it from your email link to confirm your identity." },
    { status: 401 }
  );
}
