#!/usr/bin/env bash
# deploy.sh — executado no servidor para aplicar atualizações do GitHub
set -euo pipefail

REPO_DIR="/opt/home-clabfs"

echo "[deploy] Atualizando repositório..."
cd "$REPO_DIR"
git pull origin main

echo "[deploy] Aplicando serviços Docker..."
docker compose pull
docker compose up -d --remove-orphans

echo "[deploy] Limpando imagens antigas..."
docker image prune -f

echo "[deploy] Concluído em $(date)"
