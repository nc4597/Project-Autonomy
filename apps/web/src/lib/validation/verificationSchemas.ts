import { z } from "zod";
import { INVESTOR_TYPES, TAX_ID_TYPES } from "../constants/verification";

const last4 = (message: string) => z.string().regex(/^\d{4}$/, message);
const dobString = (message: string) =>
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, message)
    .refine((value) => !Number.isNaN(new Date(value).getTime()), message);

export const step1Schema = z
  .object({
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
    taxIdType: z.enum(TAX_ID_TYPES, { required_error: "Select SSN or ITIN" }),
    taxIdLast4: last4("Enter the last 4 digits"),
    streetAddress: z.string().trim().min(1, "Street address is required"),
    city: z.string().trim().min(1, "City is required"),
    state: z.string().trim().min(2, "State is required"),
    zipCode: z.string().trim().min(3, "ZIP code is required"),
    investorType: z.enum(INVESTOR_TYPES, { required_error: "Select an investor type" }),
    // Entity / Trust — required only when investorType = ENTITY_TRUST.
    entityName: z.string().trim().max(200).optional(),
    entityTaxIdLast4: last4("Enter the last 4 digits of the EIN").optional(),
    // Joint Account co-owner — required only when investorType = JOINT.
    coOwnerFirstName: z.string().trim().max(120).optional(),
    coOwnerLastName: z.string().trim().max(120).optional(),
    coOwnerEmail: z.string().trim().email("Enter a valid email address").optional(),
    coOwnerDateOfBirth: dobString("Enter a valid date").optional(),
    coOwnerTaxIdType: z.enum(TAX_ID_TYPES).optional(),
    coOwnerTaxIdLast4: last4("Enter the last 4 digits").optional(),
    coOwnerStreetAddress: z.string().trim().max(200).optional(),
    coOwnerCity: z.string().trim().max(100).optional(),
    coOwnerState: z.string().trim().max(56).optional(),
    coOwnerZipCode: z.string().trim().max(12).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.investorType === "ENTITY_TRUST") {
      if (!data.entityName?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["entityName"], message: "Entity or trust name is required" });
      }
      if (!data.entityTaxIdLast4) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["entityTaxIdLast4"], message: "Entity EIN is required" });
      }
    }
    if (data.investorType === "JOINT") {
      if (!data.coOwnerFirstName?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["coOwnerFirstName"], message: "Co-owner first name is required" });
      }
      if (!data.coOwnerLastName?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["coOwnerLastName"], message: "Co-owner last name is required" });
      }
      if (!data.coOwnerEmail?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["coOwnerEmail"], message: "Co-owner email is required" });
      }
      if (!data.coOwnerDateOfBirth) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["coOwnerDateOfBirth"], message: "Co-owner date of birth is required" });
      }
      if (!data.coOwnerTaxIdType) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["coOwnerTaxIdType"], message: "Select SSN or ITIN" });
      }
      if (!data.coOwnerTaxIdLast4) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["coOwnerTaxIdLast4"], message: "Co-owner tax ID is required" });
      }
      if (!data.coOwnerStreetAddress?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["coOwnerStreetAddress"], message: "Co-owner street address is required" });
      }
      if (!data.coOwnerCity?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["coOwnerCity"], message: "Co-owner city is required" });
      }
      if (!data.coOwnerState?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["coOwnerState"], message: "Co-owner state is required" });
      }
      if (!data.coOwnerZipCode?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["coOwnerZipCode"], message: "Co-owner ZIP code is required" });
      }
    }
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
