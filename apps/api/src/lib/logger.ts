import pino from "pino";
import { env } from "../config/env.js";

// These paths are redacted regardless of nesting depth so that SSN
// fragments and dates of birth can never end up in Railway's log stream,
// even if a new route accidentally logs a full request body.
const PII_REDACT_PATHS = [
  "*.ssnLast4",
  "*.dateOfBirth",
  "req.body.ssnLast4",
  "req.body.dateOfBirth",
  "*.contactInfo.ssnLast4",
  "*.contactInfo.dateOfBirth",
];

export const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: PII_REDACT_PATHS,
    censor: "[REDACTED]",
  },
  transport:
    env.NODE_ENV === "development"
      ? { target: "pino-pretty", options: { colorize: true, translateTime: "HH:MM:ss" } }
      : undefined,
});
