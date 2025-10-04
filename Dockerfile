# Etapa de build
FROM node:20-alpine AS builder
WORKDIR /app

# Copia tudo
COPY . .

# Instala dependências (respeitando workspaces)
RUN npm install

# Gera o cliente Prisma (caso use)
RUN npx prisma generate --schema=apps/server/prisma/schema.prisma || true

# Builda primeiro o pacote compartilhado
RUN npm run build -w packages/shared

# Depois builda o servidor
RUN npm run build -w apps/server

# Etapa final — runtime
FROM node:20-alpine AS runner
WORKDIR /app

# Copia apenas o necessário do build anterior
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/server/package.json ./apps/server/package.json

# Define variáveis de ambiente (podem ser sobrescritas no EasyPanel)
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Inicia o servidor
CMD ["node", "apps/server/dist/index.js"]
