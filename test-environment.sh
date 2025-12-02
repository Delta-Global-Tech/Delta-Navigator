#!/bin/bash
# TESTE SIMPLES: Validar Docker + Preparar para Vault
# Tempo: 5 minutos
# Risco: ZERO (apenas validação, sem mudanças)

echo "═══════════════════════════════════════════════════════════════"
echo "  🧪 TESTE 1: Verificar status Docker atual"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Parar se houver erro
set -e

# 1. Verificar Docker
echo "1️⃣  Verificando Docker..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não está instalado!"
    exit 1
fi
echo "✅ Docker encontrado: $(docker --version)"
echo ""

# 2. Verificar Docker Compose
echo "2️⃣  Verificando Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose não está instalado!"
    exit 1
fi
echo "✅ Docker Compose encontrado: $(docker-compose --version)"
echo ""

# 3. Listar containers rodando
echo "3️⃣  Containers em execução:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

# 4. Validar docker-compose.yml
echo "4️⃣  Validando docker-compose.yml..."
if docker-compose config > /dev/null 2>&1; then
    echo "✅ docker-compose.yml é válido"
else
    echo "❌ docker-compose.yml tem erro!"
    docker-compose config
    exit 1
fi
echo ""

# 5. Testar conectividade dos backends
echo "5️⃣  Testando conectividade dos backends..."
echo ""

BACKENDS=(
    "http://localhost:3001/health|Backend SQL Server"
    "http://localhost:3002/health|Backend PostgreSQL"
    "http://localhost:3003/health|Backend Extrato"
    "http://localhost:3004/health|Backend Contratos"
)

for endpoint in "${BACKENDS[@]}"; do
    IFS='|' read -r url name <<< "$endpoint"
    echo -n "   🔗 $name ($url): "
    
    if curl -s -f "$url" > /dev/null 2>&1; then
        echo "✅ OK"
    else
        echo "⚠️  Sem resposta (pode estar parado)"
    fi
done
echo ""

# 6. Verificar variáveis de ambiente críticas
echo "6️⃣  Verificando variáveis de ambiente (.env)..."
if [ -f .env ]; then
    echo "✅ Arquivo .env encontrado"
    
    REQUIRED_VARS=(
        "POSTGRES_HOST"
        "POSTGRES_PORT"
        "POSTGRES_DATABASE"
        "POSTGRES_USER"
        "POSTGRES_PASSWORD"
        "VITE_SUPABASE_URL"
    )
    
    for var in "${REQUIRED_VARS[@]}"; do
        value=$(grep "^$var=" .env | cut -d'=' -f2-)
        if [ -n "$value" ]; then
            # Mostrar apenas primeiros 10 chars para segurança
            display="${value:0:10}..."
            echo "   ✅ $var=$display"
        else
            echo "   ❌ $var não encontrado"
        fi
    done
else
    echo "❌ Arquivo .env não encontrado!"
    exit 1
fi
echo ""

# 7. Teste de conectividade ao PostgreSQL
echo "7️⃣  Testando conectividade PostgreSQL..."
echo "   (se docker-compose estiver rodando)"

if command -v psql &> /dev/null; then
    PGHOST="${POSTGRES_HOST:-localhost}"
    PGPORT="${POSTGRES_PORT:-5432}"
    PGUSER="${POSTGRES_USER:-postgres}"
    PGDATABASE="${POSTGRES_DATABASE:-airflow_treynor}"
    
    if psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -c "SELECT version();" > /dev/null 2>&1; then
        echo "✅ PostgreSQL conectado com sucesso"
        echo "   Versão: $(psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -t -c "SELECT version();" 2>/dev/null | head -1)"
    else
        echo "⚠️  PostgreSQL não respondeu (container pode estar parado)"
    fi
else
    echo "⚠️  psql não está instalado (pulando teste de conexão)"
fi
echo ""

echo "═══════════════════════════════════════════════════════════════"
echo "  ✅ TESTE COMPLETO!"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Próximos passos para Vault:"
echo "1. Adicionar serviço Vault ao docker-compose.yml"
echo "2. Rodar: docker-compose up -d vault"
echo "3. Teste: curl http://localhost:8200/ui"
echo ""
