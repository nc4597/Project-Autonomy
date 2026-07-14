import type {
  AccreditationMethod,
  DocumentCategory,
  InvestorType,
  SourceOfFunds,
} from "../constants/verification";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  // Only claim application/json when we're actually sending a body —
  // confirm/delete/submit send none, and Fastify's body parser rejects
  // an empty body when the header promises JSON that never arrives.
  const headers = init?.body ? { "Content-Type": "application/json", ...init.headers } : init?.headers;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    // Our own route handlers send { error: "specific reason", details }.
    // Fastify's built-in error responses (e.g. body-parse failures that
    // never reach our handlers) instead send { error: "Bad Request",
    // message: "specific reason" } — the generic HTTP phrase in `error`,
    // the actually useful text in `message`. Prefer whichever is more
    // specific so failures are diagnosable instead of just saying
    // "Bad Request".
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
  ssnLast4: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  investorType: InvestorType;
}

export interface KycAmlInfoRecord {
  countryOfCitizenship: string;
  taxResidence: string;
  sourceOfFunds: SourceOfFunds;
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
  hubspotSyncStatus: string;
}

export function createVerificationDraft(dealId: string) {
  return request<{ id: string }>("/api/verifications", {
    method: "POST",
    body: JSON.stringify({ dealId }),
  });
}

export function getVerificationDraft(id: string) {
  return request<VerificationDraft>(`/api/verifications/${id}`);
}

export function saveContactInfo(id: string, data: ContactInfoRecord) {
  return request<{ ok: true }>(`/api/verifications/${id}/contact-info`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function saveKycAmlInfo(id: string, data: KycAmlInfoRecord) {
  return request<{ ok: true }>(`/api/verifications/${id}/kyc-aml`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function saveAccreditation(id: string, data: AccreditationInfoRecord) {
  return request<{ ok: true }>(`/api/verifications/${id}/accreditation`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function presignDocument(
  id: string,
  data: { category: DocumentCategory; filename: string; mimeType: string; sizeBytes: number }
) {
  return request<{ documentId: string; uploadUrl: string; s3Key: string }>(
    `/api/verifications/${id}/documents/presign`,
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
  return request<{ ok: true; status: string }>(`/api/verifications/${id}/documents/${docId}/confirm`, {
    method: "POST",
  });
}

export function deleteDocument(id: string, docId: string) {
  return request<{ ok: true }>(`/api/verifications/${id}/documents/${docId}`, {
    method: "DELETE",
  });
}

export function saveCertification(id: string, tosVersion: string) {
  return request<{ ok: true }>(`/api/verifications/${id}/certification`, {
    method: "POST",
    body: JSON.stringify({ accepted: true, tosVersion }),
  });
}

export function submitVerification(id: string) {
  return request<{ ok: true; submittedAt: string }>(`/api/verifications/${id}/submit`, {
    method: "POST",
  });
}
