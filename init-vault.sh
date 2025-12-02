#!/bin/bash
# Script para inicializar Vault com secrets da aplicacao
# Executar apos: docker-compose up -d vault

set -e

VAULT_ADDR="http://localhost:8200"
VAULT_TOKEN="devtoken"

echo "=================================================="
echo "  Inicializando HashiCorp Vault"
echo "=================================================="
echo ""

# Aguardar Vault estar pronto
echo "[1/5] Aguardando Vault estar pronto..."
for i in {1..30}; do
  if curl -s "$VAULT_ADDR/v1/sys/health" > /dev/null 2>&1; then
    echo "[OK] Vault respondendo"
    break
  fi
  echo "   Tentativa $i/30..."
  sleep 1
done

echo ""
echo "[2/5] Verificando autenticacao..."
curl -s -H "X-Vault-Token: $VAULT_TOKEN" "$VAULT_ADDR/v1/auth/token/lookup-self" > /dev/null
echo "[OK] Token valido"

echo ""
echo "[3/5] Adicionando secrets..."

# Secrets do PostgreSQL
curl -s -X POST \
  -H "X-Vault-Token: $VAULT_TOKEN" \
  -d '{"data":{"data":{"value":"MinhaSenh@123"}}}' \
  "$VAULT_ADDR/v1/secret/data/delta/postgres-password" > /dev/null
echo "   [OK] postgres-password"

curl -s -X POST \
  -H "X-Vault-Token: $VAULT_TOKEN" \
  -d '{"data":{"data":{"value":"192.168.8.149"}}}' \
  "$VAULT_ADDR/v1/secret/data/delta/postgres-host" > /dev/null
echo "   [OK] postgres-host"

curl -s -X POST \
  -H "X-Vault-Token: $VAULT_TOKEN" \
  -d '{"data":{"data":{"value":"5432"}}}' \
  "$VAULT_ADDR/v1/secret/data/delta/postgres-port" > /dev/null
echo "   [OK] postgres-port"

curl -s -X POST \
  -H "X-Vault-Token: $VAULT_TOKEN" \
  -d '{"data":{"data":{"value":"airflow_treynor"}}}' \
  "$VAULT_ADDR/v1/secret/data/delta/postgres-db" > /dev/null
echo "   [OK] postgres-db"

curl -s -X POST \
  -H "X-Vault-Token: $VAULT_TOKEN" \
  -d '{"data":{"data":{"value":"postgres"}}}' \
  "$VAULT_ADDR/v1/secret/data/delta/postgres-user" > /dev/null
echo "   [OK] postgres-user"

# JWT Secret (gerar aleatorio)
JWT_SECRET=$(openssl rand -base64 32)
curl -s -X POST \
  -H "X-Vault-Token: $VAULT_TOKEN" \
  -d "{\"data\":{\"data\":{\"value\":\"$JWT_SECRET\"}}}" \
  "$VAULT_ADDR/v1/secret/data/delta/jwt-secret" > /dev/null
echo "   [OK] jwt-secret (aleatorio)"

echo ""
echo "[4/5] Verificando secrets armazenados..."
curl -s -H "X-Vault-Token: $VAULT_TOKEN" \
  "$VAULT_ADDR/v1/secret/data/delta/postgres-password" | jq '.data.data.value' > /dev/null
echo "   [OK] Secrets acessiveis"

echo ""
echo "[5/5] Exibindo informacoes de acesso..."
echo ""
echo "Acesso ao Vault:"
echo "   URL:   $VAULT_ADDR"
echo "   Token: $VAULT_TOKEN"
echo "   UI:    http://localhost:8200/ui"
echo ""
echo "Secrets armazenados em:"
echo "   secret/data/delta/postgres-password"
echo "   secret/data/delta/postgres-host"
echo "   secret/data/delta/postgres-port"
echo "   secret/data/delta/postgres-db"
echo "   secret/data/delta/postgres-user"
echo "   secret/data/delta/jwt-secret"
echo ""
echo "=================================================="
echo "  Vault inicializado com sucesso!"
echo "=================================================="
echo ""
echo "Próximos passos:"
echo "   1. Testar acesso: curl http://localhost:8200/v1/sys/health"
echo "   2. Modificar backends para usar Vault (ver FASE_1_VAULT_NO_DOCKER.md)"
echo "   3. Validar fallback para .env se Vault ficar unavailable"
echo ""
