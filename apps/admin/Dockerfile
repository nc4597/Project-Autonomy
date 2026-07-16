# Expects Railway's "Root Directory" for this service to be set to
# apps/admin, so the build context is this directory.

FROM node:20-slim AS build
WORKDIR /app

# Prisma's engines require OpenSSL, which node:*-slim doesn't ship.
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

COPY package.json ./
COPY prisma ./prisma
RUN npm install
RUN npx prisma generate
RUN npx prisma generate --schema=prisma/kyc/schema.prisma

COPY . .
RUN npm run build

FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Prisma's engines require OpenSSL, which node:*-slim doesn't ship —
# without it `prisma migrate deploy` dies at container start with
# "Schema engine error".
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

COPY package.json ./
COPY prisma ./prisma
RUN npm install --omit=dev
RUN npx prisma generate
RUN npx prisma generate --schema=prisma/kyc/schema.prisma

COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/next.config.mjs ./next.config.mjs

EXPOSE 3100
# Applies pending Prisma migrations for BOTH schemas (the CMS database
# and the separate KYC database), then starts the server. Railway
# injects DATABASE_URL, KYC_DATABASE_URL, and the other env vars at
# deploy time.
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma migrate deploy --schema=prisma/kyc/schema.prisma && node_modules/.bin/next start -p $PORT"]
