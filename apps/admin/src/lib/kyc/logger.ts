import pino from "pino";

// These paths are redacted regardless of nesting depth so that SSN
// fragments and dates of birth can never end up in logs, even if a
// future route accidentally logs a full request body.
const PII_REDACT_PATHS = [
  "*.taxIdLast4",
  "*.dateOfBirth",
  "*.entityTaxIdLast4",
  "*.coOwnerDateOfBirth",
  "*.coOwnerTaxIdLast4",
  "*.contactInfo.taxIdLast4",
  "*.contactInfo.dateOfBirth",
  "*.contactInfo.entityTaxIdLast4",
  "*.contactInfo.coOwnerDateOfBirth",
  "*.contactInfo.coOwnerTaxIdLast4",
];

export const kycLogger = pino({
  // process.env directly (not the validated env object): this runs at
  // module load, which happens during `next build` where the full env
  // schema can't validate yet.
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  redact: { paths: PII_REDACT_PATHS, censor: "[REDACTED]" },
});
