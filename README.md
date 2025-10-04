# Disparo Inteligente WhatsApp

Aplicação web completa para disparo inteligente e humanizado de mensagens no WhatsApp, combinando backend Node.js/Express com processamento assíncrono via BullMQ, integrações Evolution API/OpenAI e frontend React com atualização em tempo real.

## Visão geral
- **Backend**: Node.js + Express + Prisma + BullMQ + Socket.IO
- **Frontend**: React + Vite + Chakra UI + React Query
- **Banco**: PostgreSQL
- **Fila**: Redis
- **Integrações**: Evolution API, OpenAI GPT

Consulte `docs/ARCHITECTURE.md` para detalhes da arquitetura, camadas e modelos.

## Requisitos
- Node.js 20+
- npm 9+ (ou pnpm/yarn configurados com workspaces)
- Docker (opcional, para subir Postgres + Redis rapidamente)

## Setup rápido
1. **Clonar dependências**
   ```bash
   npm install
   npm run build -w @app-disparo/shared
   ```

2. **Subir infraestrutura de apoio (opcional)**
   ```bash
   docker compose -f docker/docker-compose.yml up -d
   ```

3. **Configurar variáveis de ambiente**
   Copie `apps/server/.env.example` para `apps/server/.env` e ajuste valores.

4. **Gerar cliente Prisma e aplicar schema**
   ```bash
   npm run prisma:generate -w @app-disparo/server
   npx prisma migrate dev --schema apps/server/prisma/schema.prisma
   npm run prisma:seed -w @app-disparo/server
   ```

5. **Executar em modo desenvolvimento**
   ```bash
   npm run dev
   ```
   O comando roda backend (`http://localhost:4000`) e frontend (`http://localhost:5173`) em paralelo.

## Scripts úteis
| Comando | Descrição |
| --- | --- |
| `npm run dev:server` | Inicia somente o backend com recarregamento | 
| `npm run dev:client` | Inicia o frontend Vite |
| `npm run build` | Build completo (server + client) |
| `npm run prisma:migrate -w @app-disparo/server` | Aplica migrações em produção |
| `npm run prisma:seed -w @app-disparo/server` | Popula usuário administrador padrão |

## Deploy no EasyPanel (resumo)
- Configure duas Apps ou uma App + Static Site:
  - Backend (Node):
    - Install: `npm ci`
    - Build: `npm run build -w apps/server`
    - Start: `node apps/server/dist/index.js`
    - Env: `PORT=4000`, `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `OPENAI_API_KEY` (opcional), `EVOLUTION_API_URL/KEY` (opcional)
  - Frontend (Static):
    - Build: `npm run build -w apps/client`
    - Output dir: `apps/client/dist`
    - Configure proxy do frontend para API `/api` → backend e preserve o caminho `/socket.io` para WebSocket.
- Certifique `secure` dos cookies em produção e habilite HTTPS.


## Testes e validações
- **Backend**: recomenda-se Jest para unitários (`services`, `utils`) e integração com `supertest`. Coloque arquivos de teste em `apps/server/tests`. Exemplos
  ```bash
  npx jest apps/server/tests/campaign.service.spec.ts
  ```
- **Frontend**: utilizar `vitest` + `@testing-library/react` para componentes críticos (formularios de campanha, realtime). 
- **Fluxos end-to-end**: sugerido Playwright simulando login, upload CSV, criação de campanha e acompanhamento em tempo real.

## Fluxo operacional
1. Crie instância Evolution API e valide conexão em `/settings`.
2. Cadastre template de mensagem com variáveis (ex: `{nome}`, `{empresa}`).
3. Importe lista CSV em `/contact-lists` e publique.
4. Crie campanha em `/campaigns` definindo:
   - Fluxo multi-etapas (ex.: sondagem + mensagem principal + follow-up) com delays e regras por passo
   - Template inicial, lista de contatos e instância WhatsApp
   - Intervalos anti-ban globais (min/máx, pausas longas, limite diário) e janela de envio
   - Modo teste/live e agendamento, se necessário
5. Acompanhe progresso em `/campaigns/:id` com atualizações via Socket.IO, monitorando o status de cada etapa.
6. Exporte relatório ao finalizar (JSON ou CSV).

## Segurança & Boas práticas
- Tokens JWT emitidos no login; mantenha `JWT_SECRET` seguro.
- API Keys (Evolution/OpenAI) via variáveis de ambiente. Nunca commit.
- Upload CSV validado (`papaparse`) com normalização E.164.
- Anti-ban engine controla intervalos, pausas longas, janela permitida e limite diário. Ajuste com cautela conforme política da conta WhatsApp.
- Blacklist central evita disparos indesejados.

## Próximos passos sugeridos
- Automatizar testes (GitHub Actions) com lint/build + unitários.
- Configurar monitoramento Prometheus/Grafana a partir do endpoint `/api/health/metrics`.
- Adicionar interface para logs detalhados da fila e gerenciamento de workers.

---
Credenciais iniciais após seed: `admin@disparo.app` / `admin123`
# disparo
