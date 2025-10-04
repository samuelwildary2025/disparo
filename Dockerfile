# ========================
# 1️⃣ Etapa de build
# ========================
FROM node:20-alpine AS builder

WORKDIR /app

# Copia tudo
COPY . .

# Instala dependências de todas as workspaces
RUN npm install

# Gera o cliente Prisma
RUN npx prisma generate --schema=apps/server/prisma/schema.prisma

# Builda o pacote compartilhado e o servidor
RUN npm run build -w packages/shared || true
RUN npm run build -w apps/server


# ========================
# 2️⃣ Etapa de execução
# ========================
FROM node:20-alpine AS runner

WORKDIR /app

# Copia os arquivos do servidor já compilados
COPY --from=builder /app/apps/server/dist ./dist
COPY --from=builder /app/apps/server/package*.json ./
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Instala apenas dependências de produção
RUN npm install --omit=dev

# Copia o arquivo .env para dentro do container
COPY .env .env

# Expõe a porta padrão
EXPOSE 3000

# Comando para iniciar o app
CMD ["node", "dist/index.js"]
