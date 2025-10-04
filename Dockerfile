# ========================
# 1️⃣ Etapa de build
# ========================
FROM node:20-alpine AS builder

WORKDIR /app

# Copia tudo de uma vez para garantir links corretos dos workspaces
COPY . .

# Instala dependências de todas as workspaces
RUN npm install

# Gera os tipos compartilhados e builda o pacote compartilhado
RUN npm run build -w packages/shared || true

# Agora builda o servidor
RUN npm run build -w apps/server


# ========================
# 2️⃣ Etapa de execução
# ========================
FROM node:20-alpine AS runner

WORKDIR /app

# Copia apenas o servidor e o pacote compartilhado (já buildados)
COPY --from=builder /app/apps/server/dist ./dist
COPY --from=builder /app/apps/server/package*.json ./
COPY --from=builder /app/packages ./packages

# Instala dependências de produção
RUN npm install --omit=dev

EXPOSE 3000

CMD ["node", "dist/index.js"]
