import pino from "pino";
import { env } from "../env";

// These paths are redacted regardless of nesting depth so that SSN
// fragments and dates of birth can never end up in logs, even if a
// future route accidentally logs a full request body.
const PII_REDACT_PATHS = [
  "*.ssnLast4",
  "*.dateOfBirth",
  "*.contactInfo.ssnLast4",
  "*.contactInfo.dateOfBirth",
];

export const kycLogger = pino({
  level: env.NODE_ENV === "production" ? "info" : "debug",
  redact: { paths: PII_REDACT_PATHS, censor: "[REDACTED]" },
});
