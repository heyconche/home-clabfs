#!/usr/bin/env bash
# setup-server.sh — configuração inicial do servidor (rodar após install-docker.sh)
set -euo pipefail

REPO_URL="https://github.com/SEU_USUARIO/home-clabfs.git"  # ajuste aqui
REPO_DIR="/opt/home-clabfs"

echo "[1/5] Instalando Samba..."
sudo apt-get install -y -q samba

echo "[2/5] Copiando config do Samba..."
sudo cp "$REPO_DIR/samba/smb.conf" /etc/samba/smb.conf
echo "IMPORTANTE: defina a senha Samba do usuário jconche:"
sudo smbpasswd -a jconche
sudo systemctl enable --now smbd nmbd

echo "[3/5] Criando pastas no NAS..."
sudo mkdir -p /mnt/nas/{public,jconche,immich,immich-db,vaultwarden,ghost,nextcloud}
sudo chown -R jconche:users /mnt/nas/jconche
sudo chmod 775 /mnt/nas/public

echo "[4/5] Clonando repositório..."
sudo git clone "$REPO_URL" "$REPO_DIR" || (cd "$REPO_DIR" && sudo git pull)
sudo chown -R "$USER":"$USER" "$REPO_DIR"

echo "[5/5] Copiando .env e subindo serviços..."
if [ ! -f "$REPO_DIR/.env" ]; then
  cp "$REPO_DIR/.env.example" "$REPO_DIR/.env"
  echo ""
  echo "ATENÇÃO: edite $REPO_DIR/.env com suas senhas antes de continuar!"
  echo "  nano $REPO_DIR/.env"
  echo "Depois execute: cd $REPO_DIR && docker compose up -d"
else
  cd "$REPO_DIR"
  docker compose up -d
fi

echo ""
echo "Setup concluído!"
