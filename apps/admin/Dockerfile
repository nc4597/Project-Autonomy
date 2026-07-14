# Expects Railway's "Root Directory" for this service to be set to
# apps/admin, so the build context is this directory.

FROM node:20-slim AS build
WORKDIR /app

COPY package.json ./
COPY prisma ./prisma
RUN npm install
RUN npx prisma generate

COPY . .
RUN npm run build

FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package.json ./
COPY prisma ./prisma
RUN npm install --omit=dev
RUN npx prisma generate

COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/next.config.mjs ./next.config.mjs

EXPOSE 3100
# Applies pending Prisma migrations, then starts the server. Railway
# injects DATABASE_URL and the other env vars at deploy time.
CMD ["sh", "-c", "npx prisma migrate deploy && node_modules/.bin/next start -p $PORT"]
