import type {
  AccreditationMethod,
  DocumentCategory,
  InvestorType,
  TaxIdType,
} from "../constants/verification";
import type { VerificationFormConfig } from "../verification/formConfig";

// The KYC/AML backend now lives inside apps/admin (merged in from the
// former standalone apps/api) — every path below is under its
// /api/public/kyc prefix, which apps/admin's auth middleware treats as
// unauthenticated (investors filling out this wizard are never logged
// into the admin CMS).
const ADMIN_BASE_URL = process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL ?? "http://localhost:3100";
const KYC_API_PREFIX = "/api/public/kyc";

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

// Per-draft access key, held only by this browser (localStorage). The
// server hands it out at draft creation (or through the resume unlock
// challenge) and requires it on every draft read/save.
const SECRET_PREFIX = "verification-secret:";

export function storeDraftSecret(submissionId: string, secret: string) {
  window.localStorage.setItem(SECRET_PREFIX + submissionId, secret);
}

function getDraftSecret(submissionId: string): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(SECRET_PREFIX + submissionId);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  // Only claim application/json when we're actually sending a body —
  // confirm/delete/submit send none, and a strict JSON body parser
  // rejects an empty body when the header promises JSON that never
  // arrives.
  let headers: HeadersInit | undefined = init?.body
    ? { "Content-Type": "application/json", ...init.headers }
    : init?.headers;

  // Draft-scoped paths carry the draft's access key when we hold one.
  const draftId = path.match(/^\/verifications\/([^/?]+)/)?.[1];
  const secret = draftId ? getDraftSecret(draftId) : null;
  if (secret) headers = { ...headers, "x-draft-secret": secret };

  const response = await fetch(`${ADMIN_BASE_URL}${KYC_API_PREFIX}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    // Our own route handlers send { error: "specific reason", details }.
    // Next.js/framework-level error responses instead send a generic
    // { error: "..." } too, but just in case something upstream ever
    // sends { message } instead, prefer whichever is more specific.
    const reason = body.message ?? body.error ?? `Request failed with status ${response.status}`;
    throw new ApiError(reason, response.status, body.details);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export interface DocumentRecord {
  id: string;
  category: DocumentCategory;
  originalFilename: string;
  status: "PENDING" | "UPLOADED" | "REJECTED";
  createdAt: string;
}

export interface ContactInfoRecord {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  taxIdType: TaxIdType;
  taxIdLast4: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  investorType: InvestorType;
  entityName: string | null;
  entityTaxIdLast4: string | null;
  coOwnerFirstName: string | null;
  coOwnerLastName: string | null;
  coOwnerEmail: string | null;
  coOwnerDateOfBirth: string | null;
  coOwnerTaxIdType: TaxIdType | null;
  coOwnerTaxIdLast4: string | null;
  coOwnerStreetAddress: string | null;
  coOwnerCity: string | null;
  coOwnerState: string | null;
  coOwnerZipCode: string | null;
}

export interface KycAmlInfoRecord {
  countryOfCitizenship: string;
  taxResidence: string;
  // Stores the selected option's display label — the option list is
  // admin-configurable (see lib/verification/formConfig.ts).
  sourceOfFunds: string;
}

export interface CustomAnswerRecord {
  fieldKey: string;
  value: string;
}

export interface AccreditationInfoRecord {
  method: AccreditationMethod;
}

export interface VerificationDraft {
  id: string;
  dealId: string;
  status: "DRAFT" | "SUBMITTED";
  currentStep: number;
  contactInfo: ContactInfoRecord | null;
  kycAmlInfo: KycAmlInfoRecord | null;
  accreditation: AccreditationInfoRecord | null;
  certification: { acceptedAt: string; tosVersion: string } | null;
  documents: DocumentRecord[];
  customAnswers?: CustomAnswerRecord[];
}

export function getFormConfig() {
  return request<VerificationFormConfig>("/form-config");
}

/**
 * Saves one admin-defined page's answers; advanceTo moves the draft's
 * resume point past this page (the server clamps it to the wizard's
 * real length).
 */
export function savePageAnswers(
  id: string,
  customAnswers: Record<string, string>,
  advanceTo?: number
) {
  return request<{ ok: true }>(`/verifications/${id}/page-answers`, {
    method: "PATCH",
    body: JSON.stringify({ customAnswers, advanceTo }),
  });
}

export function createVerificationDraft(dealId: string) {
  return request<{ id: string; clientSecret: string | null }>("/verifications", {
    method: "POST",
    body: JSON.stringify({ dealId }),
  });
}

export function getVerificationDraft(id: string) {
  return request<VerificationDraft>(`/verifications/${id}`);
}

// Save shape, distinct from ContactInfoRecord (the fetched shape): the
// entity/co-owner fields are only ever filled in for their matching
// investor type, so they're optional here rather than `string | null` —
// the server nulls out whichever group doesn't apply.
export interface ContactInfoInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  taxIdType: TaxIdType;
  taxIdLast4: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  investorType: InvestorType;
  entityName?: string;
  entityTaxIdLast4?: string;
  coOwnerFirstName?: string;
  coOwnerLastName?: string;
  coOwnerEmail?: string;
  coOwnerDateOfBirth?: string;
  coOwnerTaxIdType?: TaxIdType;
  coOwnerTaxIdLast4?: string;
  coOwnerStreetAddress?: string;
  coOwnerCity?: string;
  coOwnerState?: string;
  coOwnerZipCode?: string;
}

export function saveContactInfo(
  id: string,
  data: ContactInfoInput,
  customAnswers?: Record<string, string>
) {
  return request<{ ok: true }>(`/verifications/${id}/contact-info`, {
    method: "PATCH",
    body: JSON.stringify({ ...data, customAnswers }),
  });
}

export function saveKycAmlInfo(
  id: string,
  data: KycAmlInfoRecord,
  customAnswers?: Record<string, string>
) {
  return request<{ ok: true }>(`/verifications/${id}/kyc-aml`, {
    method: "PATCH",
    body: JSON.stringify({ ...data, customAnswers }),
  });
}

export function saveAccreditation(
  id: string,
  data: AccreditationInfoRecord,
  customAnswers?: Record<string, string>
) {
  return request<{ ok: true }>(`/verifications/${id}/accreditation`, {
    method: "PATCH",
    body: JSON.stringify({ ...data, customAnswers }),
  });
}

export function presignDocument(
  id: string,
  data: { category: DocumentCategory; filename: string; mimeType: string; sizeBytes: number }
) {
  return request<{ documentId: string; uploadUrl: string; s3Key: string }>(
    `/verifications/${id}/documents/presign`,
    { method: "POST", body: JSON.stringify(data) }
  );
}

export async function uploadToPresignedUrl(uploadUrl: string, file: File) {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!response.ok) {
    throw new Error(`Upload failed with status ${response.status}`);
  }
}

export function confirmDocument(id: string, docId: string) {
  return request<{ ok: true; status: string }>(`/verifications/${id}/documents/${docId}/confirm`, {
    method: "POST",
  });
}

export function deleteDocument(id: string, docId: string) {
  return request<{ ok: true }>(`/verifications/${id}/documents/${docId}`, {
    method: "DELETE",
  });
}

export function saveCertification(id: string, tosVersion: string) {
  return request<{ ok: true }>(`/verifications/${id}/certification`, {
    method: "POST",
    body: JSON.stringify({ accepted: true, tosVersion }),
  });
}

export function submitVerification(id: string, captchaToken?: string) {
  return request<{ ok: true; submittedAt: string }>(`/verifications/${id}/submit`, {
    method: "POST",
    ...(captchaToken ? { body: JSON.stringify({ captchaToken }) } : {}),
  });
}

/**
 * Identity challenge behind resume links: verifies the email + tax ID
 * last-4 the investor applied with and returns the draft's access key
 * for this device. Rate-limited server-side.
 */
export function unlockVerificationDraft(id: string, email: string, taxIdLast4: string) {
  return request<{ clientSecret: string }>(`/verifications/${id}/unlock`, {
    method: "POST",
    body: JSON.stringify({ email, taxIdLast4 }),
  });
}

export interface PrecheckResult {
  matched: boolean;
  reason?: "none" | "expired" | "error";
  sourceDealName?: string;
  verifiedOn?: string;
  validThrough?: string;
}

/**
 * Returning-investor precheck: confirms the email + tax ID last-4 an
 * investor previously applied with, and — if a still-valid accreditation
 * is found — fast-tracks this fresh draft to Verified server-side in the
 * same call. Rate-limited server-side, same as the resume-link identity
 * challenge.
 */
export function precheckVerification(id: string, email: string, taxIdLast4: string) {
  return request<PrecheckResult>(`/verifications/${id}/precheck`, {
    method: "POST",
    body: JSON.stringify({ email, taxIdLast4 }),
  });
}
