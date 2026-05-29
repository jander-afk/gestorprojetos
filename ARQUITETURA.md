# Kanban SHU — Arquitetura Geral (Passo 1)

App web de gestão de projetos ágil para a operação T/Rawzzi + Sua Hora Unha. Quadro Kanban de 7 colunas, visões diária/semanal/mensal e disparos automáticos por WhatsApp. Mobile-first, hospedado em VPS Hostinger (Ubuntu).

> **Escopo confirmado:** app **single-user** (um gestor) + WhatsApp via **Meta Cloud API oficial**. Sem atribuição de tarefas, membros ou papéis — o schema foi enxugado para isso. Reintroduzir multiusuário depois é barato.

---

## 1. Decisões de arquitetura (e por quê)

Antes do código, quatro decisões que mudam o projeto inteiro. Coloco a recomendação e o motivo — discorde onde fizer sentido.

**1.1 Monolito Next.js, não Next + Express separados.**
O briefing diz "Node (Express) ou as API Routes do Next". Rodar os dois é desperdício numa VPS única: dois processos, dois deploys, CORS interno, mais memória. Recomendo **Next.js 14 (App Router) como monolito full-stack** — front e back no mesmo projeto, usando Route Handlers (`app/api/**/route.ts`) e Server Actions. Um build, um container, um deploy. Express só se um dia a API precisar ser consumida por clientes externos além do próprio app — não é o caso hoje.

**1.2 As notificações agendadas NÃO são webhooks. São jobs.**
Esse é o ponto mais importante e o que normalmente quebra esse tipo de projeto. Três dos quatro gatilhos do WhatsApp dependem de *tempo*, não de evento HTTP:

| Gatilho | Natureza | Mecanismo correto |
|---|---|---|
| Resumo matinal 08:00 | Recorrente por horário | Job repetível (cron) por fuso do usuário |
| Lembrete 2h antes do prazo | Agendado por tarefa | Job atrasado (delayed job), agendado quando a `dueDate` é definida/alterada |
| Movido p/ "Pendente" | Evento de estado | Disparo imediato na transição |
| Entrou em "Aprovado"/"Concluído" | Evento de estado | Disparo imediato na transição |

Webhook puro só resolve os dois últimos. Para os dois primeiros é preciso um **scheduler com fila**. Recomendo **BullMQ + Redis**: job repetível para o resumo matinal e *delayed jobs* para o lembrete de prazo (reagendados se a data mudar, cancelados se a tarefa sair do prazo). Um **worker** separado consome a fila e chama o WhatsApp. Sem isso, "todo dia às 08:00" vira promessa que não cumpre.

**1.3 WhatsApp via Meta Cloud API oficial, atrás de uma interface — e a regra dos templates.**
Provider escolhido: **WhatsApp Cloud API oficial** (Graph API da Meta). Mais robusta e sem risco de banimento. Fica **isolada atrás de uma interface `WhatsappProvider`**, então trocar de provider depois é mudar uma implementação, não reescrever o sistema.

A consequência que muda o projeto: a Cloud API **não permite mensagem de texto livre fora da janela de 24h** de atendimento. Como **todos os quatro gatilhos** (resumo 08:00, lembrete de prazo, gargalo, sucesso) são *iniciados pelo sistema* — não são resposta a uma mensagem do cliente —, eles **obrigatoriamente usam Message Templates pré-aprovados** no WhatsApp Manager. Implicações práticas:

- Cada tipo de notificação precisa de um template aprovado (com placeholders `{{1}}`, `{{2}}`...). Aprovação leva de minutos a ~1 dia.
- O texto fica "engessado" pelo template; o que varia são os parâmetros (nº de tarefas, título, prazo). O `NotificationLog.payload` guarda esses params e `templateName` guarda qual template foi usado.
- Pré-requisitos de conta: WhatsApp Business Account + número dedicado verificado + App na Meta for Developers + token de acesso permanente.

> Trade-off honesto: a Cloud API tem custo por conversa e burocracia de templates, mas elimina o risco de bloqueio do número — decisão correta para algo que dispara todo dia de forma automática.

**1.4 PostgreSQL, não MySQL.**
Ambos funcionam com Prisma. Escolho Postgres por: tipos `enum` nativos, melhor tratamento de timezone (`timestamptz`), `JSONB` para o payload de notificações e maturidade com Prisma. MySQL só se já houver padronização/licença na infra — não há indício disso.

---

## 2. Stack final

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 14 (App Router), React 18, TypeScript |
| Estilo | Tailwind CSS + design tokens (CSS variables) |
| Ícones | lucide-react |
| Drag & Drop | @dnd-kit (core + sortable) — performático em touch |
| Estado servidor | TanStack Query (cache, optimistic update no D&D) |
| Datas | date-fns + date-fns-tz |
| API | Route Handlers do Next + Server Actions |
| ORM | Prisma |
| Banco | PostgreSQL 16 |
| Fila/Scheduler | BullMQ + Redis 7 |
| Worker | Processo Node dedicado (mesmo repo, `worker/`) |
| Auth | NextAuth (Credentials, estratégia JWT) + bcrypt — login único do gestor |
| WhatsApp | Meta WhatsApp Cloud API (Graph API) atrás de `WhatsappProvider` |
| Proxy/TLS | Nginx + Let's Encrypt (Certbot) |
| Orquestração | docker-compose |

> Sobre o D&D: o briefing sugere `@hello-pangea/dnd` ou `@dnd-kit`. Recomendo **@dnd-kit** — o hello-pangea (fork do react-beautiful-dnd) tem suporte a touch mais frágil e está em modo manutenção. Em mobile/tablet, que é o foco, dnd-kit ganha.

---

## 3. Topologia de deploy (VPS Hostinger / Ubuntu)

Observação rápida de nomenclatura: o pedido fala em "VPN/VPS" — o que hospeda o app é a **VPS** (servidor). VPN é túnel de rede; se quiser acesso restrito à equipe, dá para colocar o painel atrás de uma VPN/allowlist depois, mas é camada separada.

Tudo em `docker-compose`, um único host:

```
                    Internet (HTTPS 443)
                          │
                    ┌─────▼─────┐
                    │   Nginx   │  TLS (Let's Encrypt), reverse proxy
                    └─────┬─────┘
                          │
              ┌───────────▼───────────┐
              │   web (Next.js)       │  front + API + auth  :3000
              └───────┬───────────────┘
                      │ enfileira jobs
        ┌─────────────▼─────────────┐
        │        Redis (BullMQ)     │
        └─────────────┬─────────────┘
                      │ consome
              ┌───────▼───────┐        ┌──────────────────────┐
              │  worker (Node)│───────▶│ Meta Cloud API (HTTPS)│──▶ WhatsApp
              └───────┬───────┘        │   graph.facebook.com  │
                      │                └──────────────────────┘
              ┌───────▼───────┐
              │  PostgreSQL   │  (volume persistente)
              └───────────────┘
```

Containers: `nginx`, `web`, `worker`, `postgres`, `redis`. A Cloud API é serviço **externo** da Meta (não roda na VPS) — o worker chama `graph.facebook.com` via HTTPS com o token. Deploy via `git pull` + `docker compose up -d --build`. Migrações Prisma rodam no start do `web` (`prisma migrate deploy`).

---

## 4. Fluxo das notificações (ponta a ponta)

**Eventos de estado (Pendente / Aprovado / Concluído):**
Mudou o status numa Route Handler → grava `TaskActivity` → enfileira job `notify.statusChange` no Redis → worker monta o texto e chama o `WhatsappProvider` → grava `NotificationLog`.

**Resumo matinal (08:00):**
Job repetível por usuário, agendado no fuso de cada um (`User.timezone`). Worker busca tarefas em `FOCO_HOJE`, monta o relatório e envia. `NotificationLog` evita envio duplicado se o worker reiniciar.

**Lembrete de prazo (T-2h):**
Ao criar/editar uma tarefa com `dueDate`, enfileira um *delayed job* para `dueDate − 2h`. Se a data mudar, o job antigo é removido pelo `jobId` (determinístico: `deadline:<taskId>`) e um novo é criado. Se a tarefa for concluída antes, o job é cancelado.

Toda preferência (ligar/desligar cada gatilho, horário do resumo, número de destino) vive em `NotificationSetting` por usuário — nada hardcoded.

---

## 5. Design System (resumo — detalhe completo no Passo 4)

- **Mobile-first real:** layout pensado primeiro para smartphone, depois tablet, depois desktop. Em mobile o Kanban vira *coluna única com seletor de etapa* + navegação por **menu inferior fixo** (Hoje / Semana / Mês / Quadro). Sete colunas lado a lado não cabem num celular — quem força isso entrega UX ruim.
- **Clean / muito white space:** densidade baixa, hierarquia por espaçamento, não por bordas.
- **Cores:** base neutra (cinza-escuro p/ texto, fundo branco-gelo) + acentos suaves nas tags de status. Como é ferramenta interna da SHU, os acentos usam a paleta oficial da marca do material de lançamento: Turquesa `#55BDBE`, Azul `#574E9C`, Laranja `#E7632F`. Dark mode via `class` do Tailwind + tokens.
- **Tipografia:** Inter (texto) com Plus Jakarta Sans opcional em títulos. Alvos de toque ≥ 44px.
- **Acessibilidade:** contraste AA, foco visível, D&D operável também por teclado (dnd-kit oferece).

---

## 6. As 7 colunas → enum de status

Fixas, na ordem do briefing. Modeladas como `enum TaskStatus` (ordem garantida no código, sem tabela extra):

`FOCO_HOJE` (1) · `BACKLOG` (2) · `EM_ANDAMENTO` (3) · `PENDENTE` (4) · `APROVADO` (5) · `EM_PRODUCAO` (6) · `CONCLUIDO` (7)

Ordenação *dentro* da coluna por campo `position` (Float, indexação fracionária — ao soltar entre duas tarefas, `position` recebe a média das vizinhas; não reindexa a coluna toda).

---

## 7. Próximos passos

- **Passo 2:** estrutura de pastas do projeto.
- **Passo 3:** Backend/API — CRUD de tarefas, endpoint de movimentação (muda status + position + enfileira notificação) e o módulo WhatsApp (provider + worker).
- **Passo 4:** Frontend — Kanban responsivo (dnd-kit) e os seletores Diária/Semanal/Mensal.

Schema do banco abaixo, em `prisma/schema.prisma`.
