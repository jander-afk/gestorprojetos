#!/usr/bin/env bash
# Bootstrap do Kanban SHU numa VPS Ubuntu limpa.
# Uso (dentro da pasta do projeto, já com o .env preenchido):
#   bash deploy/bootstrap.sh
set -euo pipefail

echo "==> Verificando Docker…"
if ! command -v docker >/dev/null 2>&1; then
  echo "==> Instalando Docker…"
  curl -fsSL https://get.docker.com | sh
fi

# Compose v2 vem embutido no Docker moderno (docker compose).
echo "==> Subindo a stack (build + migrações + serviços)…"
docker compose up -d --build

echo "==> Aguardando o serviço web responder…"
for i in $(seq 1 30); do
  if docker compose exec -T web node -e "fetch('http://localhost:3000/login').then(()=>process.exit(0)).catch(()=>process.exit(1))" 2>/dev/null; then
    break
  fi
  sleep 3
done

echo "==> Rodando o seed (gestor + quadro inicial)…"
docker compose exec -T web npm run db:seed

echo ""
echo "============================================================"
echo " Kanban SHU no ar."
echo " Acesse: http://SEU_IP_OU_DOMINIO  (porta 80 via nginx)"
echo " Login:  veja SEED_EMAIL / SEED_PASSWORD no seu .env"
echo " WhatsApp: pendente — preencha META_* quando os templates"
echo "           forem aprovados e rode: docker compose up -d"
echo "============================================================"
