#!/usr/bin/env bash
# Deploy completo + importacao do projeto SHU. Idempotente.
set -e
cd /opt/kanban
echo "==> Atualizando codigo…"
git fetch origin -q && git reset --hard origin/main
echo "==> Reconstruindo conteineres…"
docker compose up -d --build
echo "==> Sincronizando banco (checklist/links)…"
docker compose exec -T web npx prisma db push
echo "==> Importando atividades do SHU…"
docker compose exec -T web npx tsx prisma/import-shu.ts
echo ""
echo "================= TUDO_OK ================="
echo " App: http://2.24.92.252:8090"
echo "==========================================="
