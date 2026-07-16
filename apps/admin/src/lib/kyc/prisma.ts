// Separate PrismaClient for the KYC database, generated from
// prisma/kyc/schema.prisma into its own output path so it doesn't
// collide with this app's own default @prisma/client (see that schema
// file for why). Everything under lib/kyc/ and app/api/public/kyc/ uses
// this client, never the default `@prisma/client` import.
import { PrismaClient } from ".prisma/kyc-client";

export const kycPrisma = new PrismaClient();
export * from ".prisma/kyc-client";
