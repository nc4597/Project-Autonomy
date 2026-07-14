# Project-Autonomy
Platform for Reg D deals.

## KYC/AML verification flow (`apps/web` + `apps/api`)

```
npm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

npm run db:up          # starts local Postgres + MinIO via docker-compose
npm run --workspace=apps/api prisma:migrate

# create the local MinIO bucket once (console at http://localhost:9001,
# login regiment / regiment123): create a bucket named
# kyc-verification-documents

npm run dev:api         # http://localhost:4000
npm run dev:web         # http://localhost:3000
```

Visit `http://localhost:3000/verify/test-deal-123` to walk the wizard end to end.

HubSpot sync is intentionally unconfigured until `HUBSPOT_ACCESS_TOKEN` is set in `apps/api/.env` — submissions still save and complete normally, and the sync status is visible via `hubspotSyncStatus` on `GET /api/verifications/:id`.
