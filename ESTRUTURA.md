# Kanban SHU — Estrutura de Pastas (Passo 2)

Monolito Next.js 14 (App Router) com um processo `worker` separado, ambos no mesmo repositório e na mesma imagem Docker (só muda o comando de start). Postgres + Redis + Nginx via `docker-compose`.

Decisão: **mono-repo, não dois repositórios.** Worker e web compartilham `prisma/`, `lib/` e `server/` — duplicar isso em repos separados só geraria divergência. São dois *processos*, não dois *projetos*.

```
app-kanban/
├── ARQUITETURA.md                 # Passo 1 — decisões e topologia
├── ESTRUTURA.md                   # este arquivo
├── README.md                      # setup local + deploy na VPS
├── package.json                   # scripts: dev, build, start, worker, db:*, templates:register
├── tsconfig.json
├── next.config.mjs
├── tailwind.config.ts             # tokens de cor (paleta SHU), dark mode via class
├── postcss.config.mjs
├── .env.example                   # todas as variáveis (sem segredos reais)
├── .gitignore
├── .dockerignore
├── Dockerfile                     # multi-stage; gera UMA imagem usada por web E worker
├── docker-compose.yml             # nginx, web, worker, postgres, redis
│
├── nginx/
│   └── default.conf               # reverse proxy + TLS (Let's Encrypt)
│
├── prisma/
│   ├── schema.prisma              # Passo 1 — entregue
│   ├── seed.ts                    # cria o usuário gestor + projeto "Lançamento SHU Jatiúca"
│   └── migrations/                # geradas por `prisma migrate`
│
├── public/
│   ├── manifest.webmanifest       # PWA (instalar no celular/iPad como app)
│   └── icons/                     # ícones do app
│
├── whatsapp-templates/            # >>> DEFINIÇÕES DOS TEMPLATES META (p/ aprovação) <<<
│   ├── resumo_matinal.json        # template RESUMO_MATINAL + exemplos de params
│   ├── alerta_gargalo.json        # template ALERTA_GARGALO
│   ├── alerta_sucesso.json        # template ALERTA_SUCESSO
│   └── lembrete_prazo.json        # template LEMBRETE_PRAZO
│
├── scripts/
│   └── register-templates.ts      # (opcional) sobe os templates via Graph API
│
└── src/
    ├── app/                       # ===== App Router (front + API) =====
    │   ├── layout.tsx             # html/body, providers (Theme, TanStack Query)
    │   ├── globals.css            # base Tailwind + variáveis de tema
    │   │
    │   ├── (auth)/
    │   │   └── login/
    │   │       └── page.tsx        # login e-mail/senha (NextAuth Credentials)
    │   │
    │   ├── (dashboard)/           # rotas protegidas — exigem sessão
    │   │   ├── layout.tsx          # AppShell: menu inferior (mobile) / sidebar (desktop)
    │   │   ├── page.tsx            # redireciona -> /hoje
    │   │   ├── hoje/page.tsx        # VISÃO DIÁRIA  (FOCO_HOJE + timeline das próximas horas)
    │   │   ├── semana/page.tsx      # VISÃO SEMANAL (grade Seg–Dom)
    │   │   ├── mes/page.tsx         # VISÃO MENSAL  (calendário grid)
    │   │   ├── quadro/page.tsx      # KANBAN completo (7 colunas, drag & drop)
    │   │   └── config/page.tsx      # preferências de notificação (NotificationSetting)
    │   │
    │   └── api/                    # ===== Route Handlers (REST) =====
    │       ├── auth/[...nextauth]/route.ts   # NextAuth
    │       ├── tasks/route.ts                 # GET (lista/filtra) · POST (cria)
    │       ├── tasks/[id]/route.ts            # GET · PATCH (edita) · DELETE
    │       ├── tasks/[id]/move/route.ts       # PATCH: muda status + position (+ enfileira notif.)
    │       ├── projects/route.ts              # GET · POST
    │       ├── projects/[id]/route.ts         # GET · PATCH · DELETE
    │       ├── labels/route.ts                # GET · POST
    │       ├── settings/notifications/route.ts# GET · PUT (preferências)
    │       └── webhooks/whatsapp/route.ts     # GET (verificação Meta) · POST (status de entrega)
    │
    ├── components/                 # ===== UI =====
    │   ├── ui/                     # primitivos: Button, Card, Badge, Sheet, Dialog, Switch...
    │   ├── layout/
    │   │   ├── app-shell.tsx
    │   │   ├── bottom-nav.tsx       # navegação inferior fixa (Hoje/Semana/Mês/Quadro)
    │   │   ├── view-switcher.tsx    # seletor de visão (também no topo no desktop)
    │   │   └── theme-toggle.tsx     # dark mode
    │   ├── board/
    │   │   ├── kanban-board.tsx     # contexto @dnd-kit, orquestra colunas
    │   │   ├── kanban-column.tsx    # uma das 7 etapas (droppable)
    │   │   ├── task-card.tsx        # cartão (draggable)
    │   │   └── mobile-column-picker.tsx # no celular: 1 coluna por vez + seletor
    │   ├── views/
    │   │   ├── daily-view.tsx
    │   │   ├── week-view.tsx
    │   │   └── month-view.tsx
    │   └── tasks/
    │       ├── task-dialog.tsx      # criar/editar tarefa
    │       ├── task-form.tsx
    │       └── label-picker.tsx
    │
    ├── lib/                        # ===== infra compartilhada (web + worker) =====
    │   ├── prisma.ts               # singleton PrismaClient
    │   ├── auth.ts                 # config NextAuth (Credentials + JWT)
    │   ├── queue.ts                # conexão Redis + filas BullMQ (singleton)
    │   ├── kanban.ts               # ordem/labels das 7 colunas + cálculo de position
    │   ├── dates.ts                # helpers date-fns-tz (dia/semana/mês no fuso do usuário)
    │   └── validators.ts           # schemas Zod dos payloads das rotas
    │
    ├── server/                     # ===== regras de negócio =====
    │   ├── tasks/
    │   │   └── service.ts           # create/update/move; grava TaskActivity; chama dispatcher
    │   ├── notifications/
    │   │   ├── dispatcher.ts        # >>> decide e ENFILEIRA jobs (statusChange) <<<
    │   │   ├── scheduler.ts         # >>> agenda/cancela job repetível (08:00) e delayed (T-2h) <<<
    │   │   └── templates.ts         # mapeia NotificationType -> {templateName, params}
    │   └── whatsapp/
    │       ├── provider.ts          # >>> INTERFACE WhatsappProvider (contrato) <<<
    │       ├── meta-cloud.ts        # >>> implementação Meta Cloud API (Graph) <<<
    │       └── index.ts             # factory: lê env e devolve o provider ativo
    │
    ├── workers/                    # ===== processo `worker` (container separado) =====
    │   ├── index.ts                # entrypoint: registra os processors do BullMQ
    │   ├── morning-summary.ts      # processa RESUMO_MATINAL (varre FOCO_HOJE)
    │   ├── deadline.ts             # processa LEMBRETE_PRAZO
    │   └── status-change.ts        # processa ALERTA_GARGALO / ALERTA_SUCESSO
    │
    └── types/
        └── index.ts                # tipos compartilhados (DTOs, view-models)
```

## Onde vivem as 3 peças críticas

- **`WhatsappProvider`** → `src/server/whatsapp/`. O contrato em `provider.ts`, a implementação Meta em `meta-cloud.ts`, e `index.ts` escolhe qual usar por env. Trocar de provider = nova implementação aqui, nada mais muda.
- **Worker do BullMQ** → `src/workers/`. É o processo que o container `worker` roda (`npm run worker`). Quem *enfileira* é `server/notifications/dispatcher.ts` e `scheduler.ts` (chamados pela API/serviço); quem *consome* são os arquivos de `workers/`.
- **Definições de template** → `whatsapp-templates/*.json`. Cada arquivo descreve o template como a Meta exige (nome, categoria, idioma `pt_BR`, corpo com `{{n}}`). Servem de fonte da verdade para aprovar no WhatsApp Manager e para o `templates.ts` montar os parâmetros na ordem certa.

## Dois processos, uma imagem

O `Dockerfile` gera uma única imagem. No `docker-compose.yml`:

- serviço **`web`** → comando `npm run start` (Next.js, porta 3000);
- serviço **`worker`** → comando `npm run worker` (mesma imagem, entrypoint `workers/index.ts`).

Ambos enxergam `prisma/`, `lib/` e `server/`. As migrações rodam no boot do `web` (`prisma migrate deploy`) antes do `next start`.

## Scripts previstos no `package.json`

`dev` (next dev) · `build` (next build) · `start` (next start) · `worker` (tsx/node do worker) · `db:migrate` · `db:seed` · `db:studio` · `templates:register`.

---

Próximo: **Passo 3** — código do backend (CRUD de tarefas, rota `move`, dispatcher/scheduler e o módulo WhatsApp com o provider Meta Cloud).
