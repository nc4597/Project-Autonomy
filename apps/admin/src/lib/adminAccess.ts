// Role and license vocabularies for Admin Access. Roles are
// informational for now — every role keeps full admin access; the
// structure exists for future role-based permissions. Holding Series 24
// grants Compliance Review access (see lib/compliance.ts).

export const ADMIN_ROLES = [
  "CEO",
  "President",
  "COO",
  "CFO",
  "Chief Compliance Officer",
  "Managing Director",
  "Vice President",
  "Director",
  "Associate",
  "Analyst",
  "Intern",
] as const;

export const ADMIN_LICENSES = [
  "SIE",
  "Series 6",
  "Series 7",
  "Series 24",
  "Series 63",
  "Series 65",
  "Series 66",
  "Series 79",
  "Series 82",
  "Series 99",
] as const;

export const SERIES_24 = "Series 24";
