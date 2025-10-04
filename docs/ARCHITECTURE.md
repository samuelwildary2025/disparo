# Disparo Inteligente WhatsApp – Arquitetura

## Visão Geral
A solução é composta por duas aplicações principais (backend em Node.js/Express e frontend em React) e um pacote compartilhado de contratos TypeScript. O backend expõe APIs REST e canais WebSocket para gerenciamento de campanhas de disparo, integrações externas (Evolution API e OpenAI), processamento assíncrono via filas e persistência em banco Postgres. O frontend provê uma interface responsiva para configurar campanhas, acompanhar envios em tempo real e analisar históricos.

```
app-disparo/
├─ apps/
│  ├─ server/       # API HTTP, serviços, workers
│  └─ client/       # SPA React com Vite
├─ packages/
│  └─ shared/       # Tipos, esquemas e utilidades comuns
├─ docs/            # Documentação
├─ docker/          # Arquivos de infraestrutura (Redis/Postgres)
└─ package.json     # Workspace root
```

## Backend (apps/server)
- **Plataforma**: Node.js 20+, TypeScript, Express.
- **Autenticação**: JWT + refresh tokens (armazenados em Postgres). Endpoints `/auth/login`, `/auth/refresh`, `/auth/logout`.
- **Configurações**: Variáveis de ambiente via `dotenv` + esquema validado com `zod` (`src/config/env.ts`).
- **Persistência**: PostgreSQL com Prisma ORM. Migrações controladas por `prisma migrate`. Principais modelos:
  - `User`
  - `WhatsAppInstance`
  - `Campaign` / `CampaignSchedule`
  - `ContactList` / `Contact`
  - `MessageTemplate`
  - `MessageDispatch` (histórico de envios)
  - `BlacklistEntry`
  - `SystemSetting` (limites globais)
- **Filas**: BullMQ (Redis). Filas `dispatch` e `retry`. Workers isolados em `src/workers/dispatch.worker.ts`.
- **Mensageria em Tempo Real**: Socket.IO (namespace `/events`). Atualizações de progresso, logs e alertas.
- **Integrações externas**:
  - *Evolution API*: Serviço `EvolutionClient` gerencia instâncias, valida conexão e envia mensagens.
  - *OpenAI GPT*: Serviço `MessagePersonalizer`, gera variações a partir de templates usando Chat Completions API.
- **Camadas**:
  - *Routes/Controllers*: Express routers por domínio (auth, campaigns, contacts, settings, health).
  - *Services*: Regras de negócio (CampaignService, DispatchService, TemplateService etc.).
  - *Repositories*: Prisma wrappers para desacoplar persistência.
  - *Workers*: Consumo de filas com respeito às regras anti-ban (intervalos, pausas, limites diários).
  - *Middlewares*: Autenticação, rate limiting (express-rate-limit + Redis store), validação (zod).
  - *Logging/Observabilidade*: Pino + interceptação de eventos de fila, métricas básicas expostas em `/metrics` (Prometheus format).
- **Validação CSV**: Parse com `papaparse`, validação de header obrigatório, normalização de telefone (libphonenumber-js). Pré-visualização salva em `ContactList` com flag `isDraft`.
- **Anti-Ban Engine**: Configuração por campanha (intervalos aleatórios, pausas longas, limite diário, janelas de envio). Aplicado a cada step no worker, combinando delays definidos pelo usuário com o motor global anti-ban.
- **Fluxo multi-etapas**: Cada campanha possui uma sequência de `CampaignStep` (ex.: sondagem, mensagem principal, follow-up). Para cada contato são gerados `DispatchStep` que vão sendo processados em ordem; logs e relatórios registram o status por etapa. Regras como “aguardar resposta”, “cancelar se responder” e “pular se auto-reply” ficam configuradas nos steps.
- **Modo teste & agendamento**: Campanha pode ser criada com modo `test` limitando N contatos; agendamento armazenado e disparado por cron job (`node-cron`).
- **Exportação de relatórios**: Endpoint `/campaigns/:id/report` gera CSV/JSON com status dos envios.

## Frontend (apps/client)
- **Stack**: React 18 + TypeScript + Vite, UI com Chakra UI (ou equivalente), React Query para dados, React Router para navegação.
- **Layout**: Dashboard com cards de métricas, gráficos (Chart.js) e timeline de eventos. Modo dark/light.
- **Páginas**:
  - Login/Recuperação de senha.
  - Dashboard (estatísticas gerais, status instâncias, gráfico de envios).
  - Campanhas: listagem, criação, detalhes em tempo real (painel de progresso, logs).
  - Listas de contatos: upload/preview, filtros, blacklist.
  - Configurações: chaves API, limites padrão, gerenciamento de instâncias.
- **Componentes chave**:
  - `CampaignForm` com editor de template (suporte a variáveis e pré-visualização GPT mockada).
  - `CSVUploadModal` com tabela preview + validação.
  - `DispatchProgress` conectado a Socket.IO em tempo real com gauge de progresso e log scrollable.
  - `ScheduleConfigurator` para horários permitidos e pausas.
- **Estado**: React Query + Zustand para estados locais complexos (ex. builder de template).
- **Internacionalização**: `i18next` pronto para tradução (pt-BR default).
- **Segurança**: Armazena tokens no `httpOnly` cookies (backend define); proteção de rotas via guard.

## Pacote Shared (packages/shared)
- Tipos e esquemas TypeScript compartilhados (interfaces para Campaign, Contact, API DTOs).
- Schemas `zod` espelhando payloads do backend para validação no frontend.
- Funções utilitárias (por ex. `interpolateTemplate`, `formatPhoneNumber`).

## Comunicação Backend ↔ Frontend
- Autenticação via cookies + header `Authorization` para WebSockets.
- REST endpoints retornam DTOs padronizados (`ApiResponse<T>`).
- Eventos em tempo real definidos em `packages/shared/src/events.ts`.

## Infraestrutura
- Arquivo `docker-compose.yml` levanta Postgres e Redis.
- Scripts `npm run dev` (concurrently server/client), `npm run build`, `npm run lint`, `npm run prisma:migrate`.
- Testes com Jest (unit) e Playwright (e2e básicos).

## Segurança & Boas Práticas
- Armazenamento de chaves somente em variáveis de ambiente; frontend nunca expõe secrets.
- Rate limiting e proteção contra brute force.
- Sanitização de entradas de CSV e logs.
- Retentativa exponencial para falhas de rede com Evolution API.
- Circuit breaker simples para suspender campanha se taxa de falhas exceder limiar.

## Fluxo de Campanha
1. Usuário autentica-se e acessa dashboard.
2. Cria lista de contatos via upload CSV (pré-visualização e validação).
3. Configura campanha (template, integrações, limites, agendamento).
4. Campanha enfileira contatos conforme regras Anti-Ban.
5. Worker processa fila step a step: gera mensagem (com ou sem GPT), aplica delays definidos na etapa + anti-ban global, envia via Evolution API e grava o status do `DispatchStep`.
6. Frontend recebe eventos de progresso e apresenta logs.
7. Usuário pode pausar/retomar; sistema aplica pausas automáticas.
8. Ao término, relatório exportável disponível.

## Próximos Passos para Implementação
- Configurar workspaces e dependências base.
- Implementar camada de configuração/env.
- Implementar modelos Prisma e migrações iniciais.
- Criar endpoints REST principais e workers.
- Construir UI conforme páginas descritas.
- Criar testes e documentação operacional (README, scripts).
