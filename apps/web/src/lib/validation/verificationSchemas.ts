import { z } from "zod";
import { INVESTOR_TYPES, SOURCE_OF_FUNDS } from "../constants/verification";

export const step1Schema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  email: z.string().trim().email("Enter a valid email address"),
  phone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number")
    .regex(/^[0-9+()\-.\s]+$/, "Phone number contains invalid characters"),
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
  sourceOfFunds: z.enum(SOURCE_OF_FUNDS, { required_error: "Select a source of funds" }),
});
export type Step2FormValues = z.infer<typeof step2Schema>;

// Step 3 (accreditation method) and step 4 (certification) are simple
// enough single-value selections that they're validated inline in their
// components rather than via react-hook-form + zod like steps 1-2.
