# Project-Autonomy
Platform for Reg D deals.

## KYC/AML verification flow (`apps/web` + `apps/admin`)

The KYC/AML backend lives inside `apps/admin` (a second, independent Prisma
schema/database alongside the admin CMS's own — see
`apps/admin/prisma/kyc/schema.prisma`). The standalone `apps/api` service is
kept in the repo but is no longer part of the live path.

```
npm install
cp apps/admin/.env.example apps/admin/.env
cp apps/web/.env.example apps/web/.env

npm run db:up                                        # starts local Postgres (x2) + MinIO via docker-compose
npm run --workspace=apps/admin prisma:kyc:deploy      # applies KYC migrations to regiment_kyc
npm run --workspace=apps/admin prisma:migrate         # applies admin CMS migrations to regiment_admin

# create the local MinIO buckets once (console at http://localhost:9001,
# login regiment / regiment123): create buckets named
# kyc-verification-documents and regiment-marketplace-assets

npm run dev:admin       # http://localhost:3100
npm run dev:web         # http://localhost:3000
```

Visit `http://localhost:3000/verify/test-deal-123` to walk the wizard end to end. Submitted verifications show up in `apps/admin`'s KYC Review section — the system of record for review: inline document previews, per-document downloads, a Download All zip, and an on-demand Verification Summary PDF per submission. (An earlier HubSpot sync was removed in July 2026; `apps/api` still contains its own dormant copy of that era's code.)
