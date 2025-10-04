# ========================
# 1️⃣ Etapa de build
# ========================
FROM node:20-alpine AS builder

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Copia apenas os arquivos de configuração principais primeiro (para aproveitar cache)
COPY package*.json ./
COPY tsconfig.base.json ./
COPY apps ./apps
COPY packages ./packages

# Instala dependências (ativando o modo de workspaces)
RUN npm install

# Builda apenas o servidor
RUN npm run build -w apps/server


# ========================
# 2️⃣ Etapa de execução
# ========================
FROM node:20-alpine AS runner

WORKDIR /app

# Copia apenas o servidor já compilado e dependências necessárias
COPY --from=builder /app/apps/server/dist ./dist
COPY --from=builder /app/apps/server/package*.json ./
COPY --from=builder /app/packages ./packages

# Instala apenas dependências de produção
RUN npm install --omit=dev

# Expõe a porta usada pelo servidor (ajuste se for diferente)
EXPOSE 3000

# Define o comando padrão
CMD ["node", "dist/index.js"]
