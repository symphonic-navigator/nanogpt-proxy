# apps/admin-api/Dockerfile
FROM node:22-alpine

WORKDIR /app

# Fichiers racine du monorepo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Code des apps + packages partagés
COPY apps ./apps
COPY packages ./packages

# pnpm + install
RUN corepack enable && pnpm install --frozen-lockfile

# Build de la lib core AVANT l'admin-api (ajuste le nom si besoin)
RUN pnpm --filter "@nanogpt-monorepo/core" build

# Build de l'admin-api
RUN pnpm --filter admin-api build

# On se place dans le dossier de l'app NestJS
WORKDIR /app/apps/admin-api

ENV NODE_ENV=production

EXPOSE 3001
CMD ["node", "dist/main.js"]
