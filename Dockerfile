# -----------------------------
# Etapa 1 - Build
# -----------------------------
FROM node:20-bullseye AS builder

WORKDIR /app
COPY . .

# Instala dependências
RUN npm install

# Gera cliente do Prisma
RUN npx prisma generate --schema=apps/server/prisma/schema.prisma

# Compila os pacotes
RUN npm run build -w packages/shared || true
RUN npm run build -w apps/server

# -----------------------------
# Etapa 2 - Execução
# -----------------------------
FROM node:20-bullseye
WORKDIR /app

COPY --from=builder /app .

ENV NODE_ENV=production
ENV PRISMA_CLIENT_ENGINE_TYPE=library

EXPOSE 3000
CMD ["node", "apps/server/dist/index.js"]
