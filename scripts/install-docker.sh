#!/usr/bin/env bash
# install-docker.sh — rodar UMA VEZ no servidor (Ubuntu 24.04)
set -euo pipefail

echo "[1/4] Instalando dependências..."
sudo apt-get update -q
sudo apt-get install -y -q ca-certificates curl gnupg

echo "[2/4] Adicionando repositório Docker..."
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

echo "[3/4] Instalando Docker Engine..."
sudo apt-get update -q
sudo apt-get install -y -q docker-ce docker-ce-cli containerd.io docker-compose-plugin

echo "[4/4] Adicionando usuário ao grupo docker..."
sudo usermod -aG docker "$USER"

echo ""
echo "Docker instalado com sucesso!"
echo "IMPORTANTE: faça logout e login novamente para usar docker sem sudo."
docker --version
