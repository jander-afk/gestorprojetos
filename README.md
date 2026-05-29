# Kanban SHU

App de gestão de projetos (Kanban de 7 colunas) com visões Diária, Semanal e Mensal e notificações automáticas no WhatsApp. Mobile-first. Single-user (um gestor).

Stack: Next.js 14 (App Router) · TypeScript · Prisma · PostgreSQL · Redis + BullMQ · @dnd-kit · Tailwind · NextAuth (JWT) · WhatsApp Cloud API.

Documentos de projeto: `ARQUITETURA.md` (decisões) e `ESTRUTURA.md` (pastas).

---

## Rodar localmente

Pré-requisitos: Node 20+, um Postgres e um Redis (locais ou via Docker).

```bash
cp .env.example .env        # preencha as variáveis
npm install
npx prisma migrate dev      # cria o schema
npm run db:seed             # cria o gestor + quadro de exemplo
npm run dev                 # web em http://localhost:3000
npm run worker              # em outro terminal: processador de notificações
```

Login padrão do seed: `gestor@suahoraunha.com.br` / `mudar@123` (troque via `SEED_EMAIL` / `SEED_PASSWORD`).

---

## WhatsApp (Meta Cloud API) — pré-requisitos

Os disparos são iniciados pelo sistema, então a Meta **exige Message Templates aprovados**. Antes de tudo funcionar:

1. Tenha uma WhatsApp Business Account + número dedicado verificado.
2. Crie um app na Meta for Developers e um System User com **token permanente**.
3. Preencha no `.env`: `META_PHONE_NUMBER_ID`, `META_ACCESS_TOKEN`, `META_WEBHOOK_VERIFY_TOKEN`.
4. Cadastre os 4 templates do diretório `whatsapp-templates/` no WhatsApp Manager (idioma `pt_BR`) e aguarde aprovação.
5. Configure o webhook da Meta apontando para `https://SEU_DOMINIO/api/webhooks/whatsapp` usando o mesmo `META_WEBHOOK_VERIFY_TOKEN`.

Ligue/desligue cada gatilho e ajuste o horário do resumo em **Configurações** dentro do app.

---

## Deploy na VPS Hostinger (Ubuntu)

1. Instale Docker + Docker Compose no servidor.
2. Clone o repositório e crie o `.env` (use `DATABASE_URL` apontando para o serviço `postgres`, ex.: `postgresql://kanban:senha_forte@postgres:5432/kanban?schema=public`).
3. Suba tudo:

```bash
docker compose up -d --build
```

Sobe 5 serviços: `postgres`, `redis`, `web` (Next + migrações), `worker` (BullMQ) e `nginx` (proxy). O `web` roda `prisma migrate deploy` automaticamente no start.

4. Rode o seed uma vez:

```bash
docker compose exec web npm run db:seed
```

5. **HTTPS:** aponte o domínio para o IP da VPS, emita o certificado com certbot e descomente o bloco `443` em `nginx/default.conf`, depois `docker compose restart nginx`.

### Atualizar

```bash
git pull && docker compose up -d --build
```

---

## Scripts

| Script | O quê |
|---|---|
| `npm run dev` | Next em desenvolvimento |
| `npm run worker` | Processador de notificações (BullMQ) |
| `npm run build` / `start` | Build / produção |
| `npm run db:migrate` / `db:deploy` | Migrações Prisma |
| `npm run db:seed` | Popular gestor + quadro |
| `npm run db:studio` | Prisma Studio |

---

## Como as notificações funcionam

- **Resumo matinal (08:00):** Job Scheduler do BullMQ com cron no fuso do usuário. Mudar o horário em Configurações reescreve o agendamento.
- **Lembrete de prazo (T-2h):** job atrasado com id `deadline:<taskId>`. Mudar a data reagenda; concluir cancela.
- **Gargalo (Pendente) e Sucesso (Aprovado/Concluído):** disparo imediato ao mover o card.

A rota HTTP só enfileira; o `worker` envia. Há trava anti-duplicação no `NotificationLog`.
