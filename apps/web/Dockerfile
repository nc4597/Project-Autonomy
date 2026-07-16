# Expects Railway's "Root Directory" for this service to be set to
# apps/web, so the build context is this directory.

FROM node:20-slim AS build
WORKDIR /app

# NEXT_PUBLIC_* vars are inlined into the client bundle at build time,
# not read at runtime — must be passed as a build arg, not just a
# regular deploy-time env var. Set this as a build variable on the
# Railway service.
ARG NEXT_PUBLIC_ADMIN_API_BASE_URL
ENV NEXT_PUBLIC_ADMIN_API_BASE_URL=$NEXT_PUBLIC_ADMIN_API_BASE_URL

COPY package.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package.json ./
RUN npm install --omit=dev

COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/next.config.mjs ./next.config.mjs

EXPOSE 3000
CMD ["node_modules/.bin/next", "start", "-p", "3000"]
