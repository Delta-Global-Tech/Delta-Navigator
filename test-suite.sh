#!/bin/bash

# ============================================
# Delta Navigator - Test Suite
# ============================================
# Este script testa todos os aspectos da aplicação

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Contadores
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

# ============================================
# Funções de Teste
# ============================================

print_header() {
    echo -e "${BLUE}"
    echo "═══════════════════════════════════════════════════════"
    echo "   Delta Navigator - Test Suite"
    echo "═══════════════════════════════════════════════════════"
    echo -e "${NC}"
}

print_section() {
    echo ""
    echo -e "${BLUE}▶ $1${NC}"
    echo ""
}

test_pass() {
    echo -e "${GREEN}✓ $1${NC}"
    ((TESTS_PASSED++))
    ((TESTS_TOTAL++))
}

test_fail() {
    echo -e "${RED}✗ $1${NC}"
    ((TESTS_FAILED++))
    ((TESTS_TOTAL++))
}

test_warn() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_result() {
    echo ""
    echo "═══════════════════════════════════════════════════════"
    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "${GREEN}✓ Todos os testes passaram! ($TESTS_PASSED/$TESTS_TOTAL)${NC}"
    else
        echo -e "${RED}✗ Alguns testes falharam! Passaram: $TESTS_PASSED/$TESTS_TOTAL${NC}"
    fi
    echo "═══════════════════════════════════════════════════════"
    echo ""
}

# ============================================
# Testes
# ============================================

test_docker_installed() {
    print_section "Verificando Docker"
    
    if command -v docker &> /dev/null; then
        local version=$(docker --version)
        test_pass "Docker instalado: $version"
    else
        test_fail "Docker não encontrado - instale Docker Desktop"
    fi
    
    if command -v docker-compose &> /dev/null; then
        local version=$(docker-compose --version)
        test_pass "Docker Compose instalado: $version"
    else
        test_fail "Docker Compose não encontrado"
    fi
}

test_env_files() {
    print_section "Verificando Arquivos de Configuração"
    
    if [ -f "$SCRIPT_DIR/server/.env" ]; then
        test_pass "server/.env existe"
    else
        test_warn "server/.env não encontrado - crie com: cp server/.env.example server/.env"
    fi
    
    if [ -f "$SCRIPT_DIR/server/.env.example" ]; then
        test_pass "server/.env.example existe"
    else
        test_fail "server/.env.example não encontrado"
    fi
    
    if [ -f "$SCRIPT_DIR/docker-compose.yml" ]; then
        test_pass "docker-compose.yml existe"
    else
        test_fail "docker-compose.yml não encontrado"
    fi
}

test_docker_compose_syntax() {
    print_section "Validando Sintaxe do docker-compose.yml"
    
    if docker-compose config > /dev/null 2>&1; then
        test_pass "docker-compose.yml é válido"
    else
        test_fail "docker-compose.yml possui erros de sintaxe"
        docker-compose config
    fi
}

test_containers_running() {
    print_section "Verificando Containers Rodando"
    
    if docker-compose ps | grep -q delta-frontend; then
        test_pass "Container frontend está rodando"
    else
        test_warn "Container frontend não está rodando"
    fi
    
    if docker-compose ps | grep -q delta-backend-sql; then
        test_pass "Container backend-sql está rodando"
    else
        test_warn "Container backend-sql não está rodando"
    fi
    
    if docker-compose ps | grep -q delta-backend-postgres; then
        test_pass "Container backend-postgres está rodando"
    else
        test_warn "Container backend-postgres não está rodando"
    fi
}

test_health_checks() {
    print_section "Testando Health Checks"
    
    # Frontend
    if curl -s http://localhost/health > /dev/null 2>&1; then
        test_pass "Frontend health check OK"
    else
        test_warn "Frontend não respondendo (pode estar inicializando)"
    fi
    
    # Backend SQL
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        test_pass "Backend SQL health check OK"
    else
        test_warn "Backend SQL não respondendo"
    fi
    
    # Backend PostgreSQL
    if curl -s http://localhost:3002/health > /dev/null 2>&1; then
        test_pass "Backend PostgreSQL health check OK"
    else
        test_warn "Backend PostgreSQL não respondendo"
    fi
}

test_database_connection() {
    print_section "Testando Conexão com Banco de Dados"
    
    if curl -s http://localhost:3002/api/test 2>&1 | grep -q "PostgreSQL conectado"; then
        test_pass "Banco de dados PostgreSQL conectado"
    else
        test_warn "Não conseguiu testar conexão com banco"
    fi
}

test_ports_available() {
    print_section "Verificando Portas Disponíveis"
    
    if netstat -tuln 2>/dev/null | grep -q ":80 "; then
        test_pass "Porta 80 (Frontend) disponível"
    else
        test_warn "Porta 80 pode estar em uso"
    fi
    
    if netstat -tuln 2>/dev/null | grep -q ":3001 "; then
        test_pass "Porta 3001 (Backend SQL) disponível"
    else
        test_warn "Porta 3001 pode estar em uso"
    fi
    
    if netstat -tuln 2>/dev/null | grep -q ":3002 "; then
        test_pass "Porta 3002 (Backend PostgreSQL) disponível"
    else
        test_warn "Porta 3002 pode estar em uso"
    fi
}

test_memory_usage() {
    print_section "Verificando Uso de Memória"
    
    local memory=$(docker stats --no-stream --format "{{.MemUsage}}" 2>/dev/null | head -1)
    if [ ! -z "$memory" ]; then
        test_pass "Memória total: $memory"
    else
        test_warn "Não conseguiu obter estatísticas de memória"
    fi
}

test_logs_available() {
    print_section "Verificando Logs"
    
    local log_size=$(docker-compose logs backend-postgres 2>/dev/null | wc -l)
    if [ $log_size -gt 0 ]; then
        test_pass "Logs do backend-postgres disponíveis ($log_size linhas)"
    else
        test_warn "Sem logs disponíveis para backend-postgres"
    fi
}

test_network_isolation() {
    print_section "Verificando Network Isolation"
    
    if docker network ls | grep -q delta-network; then
        test_pass "Network delta-network existe"
    else
        test_warn "Network delta-network não encontrada"
    fi
}

test_restart_policy() {
    print_section "Verificando Restart Policies"
    
    local frontend_restart=$(docker inspect --format='{{.HostConfig.RestartPolicy.Name}}' delta-frontend 2>/dev/null)
    local sql_restart=$(docker inspect --format='{{.HostConfig.RestartPolicy.Name}}' delta-backend-sql 2>/dev/null)
    local postgres_restart=$(docker inspect --format='{{.HostConfig.RestartPolicy.Name}}' delta-backend-postgres 2>/dev/null)
    
    if [ "$frontend_restart" = "unless-stopped" ]; then
        test_pass "Frontend restart policy: $frontend_restart"
    else
        test_warn "Frontend restart policy: $frontend_restart"
    fi
    
    if [ "$sql_restart" = "unless-stopped" ]; then
        test_pass "Backend SQL restart policy: $sql_restart"
    else
        test_warn "Backend SQL restart policy: $sql_restart"
    fi
    
    if [ "$postgres_restart" = "unless-stopped" ]; then
        test_pass "Backend PostgreSQL restart policy: $postgres_restart"
    else
        test_warn "Backend PostgreSQL restart policy: $postgres_restart"
    fi
}

# ============================================
# Main
# ============================================

print_header

# Executar testes
test_docker_installed
test_env_files
test_docker_compose_syntax
test_containers_running
test_health_checks
test_database_connection
test_ports_available
test_memory_usage
test_logs_available
test_network_isolation
test_restart_policy

# Mostrar resultados
print_result

# Retornar código apropriado
if [ $TESTS_FAILED -eq 0 ]; then
    exit 0
else
    exit 1
fi
