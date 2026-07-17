import type { SubmissionWithRelations } from "./serialize";

// Canonical per-investor name used for review artifacts — the
// Download All zip and the Verification Summary PDF filenames.
// "LastName_FirstName_<short id>": readable at a glance, and the short
// slice of the submission ID keeps two investors who happen to share a
// name (e.g. across different deals) from colliding or looking like the
// same person.
export function investorFolderName(submission: SubmissionWithRelations): string {
  const sanitize = (value: string) => value.trim().replace(/[^a-zA-Z0-9]+/g, "-");
  const { contactInfo } = submission;
  const namePart = contactInfo
    ? `${sanitize(contactInfo.lastName)}_${sanitize(contactInfo.firstName)}`
    : "UnknownInvestor";
  return `${namePart}_${submission.id.slice(0, 8)}`;
}
