# -----------------------------
# Etapa 1 - Build do projeto
# -----------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copia todos os manifests e código
COPY package*.json ./
COPY tsconfig.base.json ./
COPY apps ./apps
COPY packages ./packages

# Instala dependências
RUN npm install

# Gera cliente Prisma (ignora erros se não houver)
RUN npx prisma generate --schema=apps/server/prisma/schema.prisma || true

# Compila o pacote compartilhado
RUN npm run build -w packages/shared

# Remove link antigo se existir e cria novamente
RUN mkdir -p node_modules/@app-disparo && rm -rf node_modules/@app-disparo/shared && ln -s /app/packages/shared/dist node_modules/@app-disparo/shared

# Compila o servidor
RUN npm run build -w apps/server


# -----------------------------
# Etapa 2 - Execução do app
# -----------------------------
FROM node:20-alpine

WORKDIR /app

# Copia o build do servidor e shared
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared/dist ./node_modules/@app-disparo/shared

# Copia o .env se existir
COPY .env .env

EXPOSE 3000

CMD ["node", "apps/server/dist/index.js"]
