# -----------------------------
# Etapa 1 - Build
# -----------------------------
FROM node:20-alpine AS builder

WORKDIR /app
COPY . .

# Instala dependências do Prisma e compatibilidade OpenSSL 1.1
RUN apk add --no-cache openssl1.1-compat

# Instala dependências e gera Prisma
RUN npm install
RUN npx prisma generate --schema=apps/server/prisma/schema.prisma

# Compila projeto
RUN npm run build -w packages/shared || true
RUN npm run build -w apps/server

# -----------------------------
# Etapa 2 - Execução
# -----------------------------
FROM node:20-alpine
WORKDIR /app

COPY --from=builder /app .

ENV NODE_ENV=production
ENV PRISMA_CLIENT_ENGINE_TYPE=library

EXPOSE 3000
CMD ["node", "apps/server/dist/index.js"]
