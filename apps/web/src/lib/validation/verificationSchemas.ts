import { z } from "zod";
import { INVESTOR_TYPES } from "../constants/verification";

export const step1Schema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  email: z.string().trim().email("Enter a valid email address"),
  // The calling code lives in its own dropdown (ISO country value, see
  // callingCodes.ts); the two are combined into one stored string —
  // "+44 7911 123456" — at save time. National part max 15 keeps the
  // combined value inside the server's 20-char phone limit.
  phoneCountryCode: z.string().regex(/^[A-Z]{2}$/, "Select a calling code"),
  phone: z
    .string()
    .trim()
    .min(5, "Enter a valid phone number")
    .max(15, "Enter the number without the country code")
    .regex(/^[0-9()\-.\s]+$/, "Enter the number without the country code"),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date")
    .refine((value) => {
      const dob = new Date(value);
      if (Number.isNaN(dob.getTime())) return false;
      const eighteenYearsAgo = new Date();
      eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);
      return dob <= eighteenYearsAgo;
    }, "You must be at least 18 years old"),
  ssnLast4: z.string().regex(/^\d{4}$/, "Enter the last 4 digits of your SSN"),
  streetAddress: z.string().trim().min(1, "Street address is required"),
  city: z.string().trim().min(1, "City is required"),
  state: z.string().trim().min(2, "State is required"),
  zipCode: z.string().trim().min(3, "ZIP code is required"),
  investorType: z.enum(INVESTOR_TYPES, { required_error: "Select an investor type" }),
});
export type Step1FormValues = z.infer<typeof step1Schema>;

export const step2Schema = z.object({
  countryOfCitizenship: z.string().trim().min(1, "Select a country of citizenship"),
  taxResidence: z.string().trim().min(1, "Select a tax residence"),
  sourceOfFunds: z.string().trim().min(1, "Select a source of funds").max(120),
});
export type Step2FormValues = z.infer<typeof step2Schema>;

// Step 3 (accreditation method) and step 4 (certification) are simple
// enough single-value selections that they're validated inline in their
// components rather than via react-hook-form + zod like steps 1-2.
