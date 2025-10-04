# ========================
# 1️⃣ Etapa de build
# ========================
FROM node:20-alpine AS builder

WORKDIR /app

# Copia tudo (monorepo completo)
COPY . .

# Instala dependências de todas as workspaces
RUN npm install

# Gera o cliente do Prisma antes de buildar
RUN npx prisma generate --schema=apps/server/prisma/schema.prisma

# Builda pacotes compartilhados (ignora se não houver build script)
RUN npm run build -w packages/shared || true

# Builda o servidor (depois do Prisma estar pronto)
RUN npm run build -w apps/server


# ========================
# 2️⃣ Etapa de execução
# ========================
FROM node:20-alpine AS runner

WORKDIR /app

# Copia os arquivos necessários
COPY --from=builder /app/apps/server/dist ./dist
COPY --from=builder /app/apps/server/package*.json ./
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/packages ./packages

# Instala apenas dependências de produção
RUN npm install --omit=dev

EXPOSE 3000

CMD ["node", "dist/index.js"]
