import { z } from "zod";

// Validation only enforces shape/type, not completeness — same
// leniency as dealSchema.ts, since the admin form is filled in
// incrementally.
export const teamMemberInputSchema = z.object({
  name: z.string().default(""),
  title: z.string().default(""),
  bio: z.string().default(""),
  photoUrl: z.string().optional().nullable(),
  sortOrder: z.number().default(0),
});

export type TeamMemberInput = z.infer<typeof teamMemberInputSchema>;
