# Expects Railway's "Root Directory" for this service to be set to
# apps/api, so the build context is this directory (not the monorepo
# root) — apps/api has no dependency on apps/web or the workspace root,
# so this is self-contained.

FROM node:20-slim AS build
WORKDIR /app

COPY package.json ./
COPY prisma ./prisma
RUN npm install

COPY tsconfig.json ./
COPY src ./src
RUN npm run prisma:generate
RUN npm run build

FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package.json ./
COPY prisma ./prisma
RUN npm install --omit=dev

COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/dist ./dist

EXPOSE 4000
# Applies pending Prisma migrations, then starts the server. Railway
# injects DATABASE_URL and the other env vars at deploy time.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
