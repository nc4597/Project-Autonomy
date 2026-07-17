import NextAuth from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import { prisma } from "@/lib/prisma";

// Deliberately reads these three via plain process.env rather than the
// strict Zod-validated env.ts — Auth.js itself tolerates them being
// undefined at build time (sign-in just fails at runtime until they're
// set), and routing them through env.ts's eager validation would crash
// the whole app at startup if they're missing, the same class of bug
// fixed elsewhere (see "Defer all env validation/client construction to
// first use, not import"). Names match the Azure app registration's own
// terminology (Application ID / Tenant ID / Secret Value) rather than
// Auth.js's usual AUTH_MICROSOFT_ENTRA_ID_* convention, since that's how
// they're already recorded from the Azure portal.
export const { handlers, auth, signIn, signOut } = NextAuth({
  // Railway (like most PaaS hosts) terminates HTTPS at a reverse proxy in
  // front of the container, so the request Auth.js sees looks like plain
  // HTTP from an internal IP — without this it builds the wrong (http://
  // internal) callback URL instead of the real public https:// one.
  trustHost: true,
  providers: [
    MicrosoftEntraID({
      clientId: process.env.APPLICATION_ID,
      clientSecret: process.env.SECRET_VALUE,
      // Scoping to our own tenant means only Regiment Securities accounts
      // can even attempt sign-in — the AdminUser allowlist below is the
      // second, separate check for *which* of those accounts get in.
      issuer: process.env.TENANT_ID
        ? `https://login.microsoftonline.com/${process.env.TENANT_ID}/v2.0`
        : undefined,
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ user, profile }) {
      // Microsoft doesn't always populate the `email` claim (it depends on
      // tenant/account configuration) — preferred_username is the UPN,
      // which is usually the same address and a more reliable fallback.
      const email = user.email ?? (profile as { preferred_username?: string } | undefined)?.preferred_username;
      if (!email) return false;

      // Case-insensitive at the database level, not just via .toLowerCase()
      // in JS — belt and suspenders against however the email ends up
      // cased on either side.
      const allowed = await prisma.adminUser.findFirst({
        where: { email: { equals: email, mode: "insensitive" } },
      });
      return Boolean(allowed);
    },
  },
});
