#!/bin/bash

# ============================================
# Delta Navigator - Docker Management Script
# ============================================
# Este script facilita o gerenciamento dos containers

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================
# Funções
# ============================================

print_header() {
    echo -e "${BLUE}"
    echo "═══════════════════════════════════════════════════════"
    echo "   Delta Navigator - Docker Management"
    echo "═══════════════════════════════════════════════════════"
    echo -e "${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# ============================================
# Comando: status
# ============================================

status() {
    print_info "Verificando status dos containers..."
    echo ""
    docker-compose ps
    echo ""
    
    print_info "Verificando health checks..."
    echo ""
    
    local frontend_health=$(docker inspect --format='{{.State.Health.Status}}' delta-frontend 2>/dev/null)
    local sql_health=$(docker inspect --format='{{.State.Health.Status}}' delta-backend-sql 2>/dev/null)
    local postgres_health=$(docker inspect --format='{{.State.Health.Status}}' delta-backend-postgres 2>/dev/null)
    local nginx_health=$(docker inspect --format='{{.State.Health.Status}}' delta-nginx 2>/dev/null)
    
    echo "Frontend:         $frontend_health"
    echo "Backend SQL:      $sql_health"
    echo "Backend Postgres: $postgres_health"
    echo "Nginx:            $nginx_health"
    echo ""
}

# ============================================
# Comando: logs
# ============================================

logs() {
    local service=${1:-all}
    
    case $service in
        all)
            print_info "Mostrando logs de todos os serviços..."
            docker-compose logs -f --tail=50
            ;;
        postgres)
            print_info "Mostrando logs do Backend PostgreSQL..."
            docker-compose logs -f --tail=50 backend-postgres
            ;;
        sql)
            print_info "Mostrando logs do Backend SQL..."
            docker-compose logs -f --tail=50 backend-sql
            ;;
        frontend)
            print_info "Mostrando logs do Frontend..."
            docker-compose logs -f --tail=50 frontend
            ;;
        nginx)
            print_info "Mostrando logs do Nginx..."
            docker-compose logs -f --tail=50 nginx
            ;;
        *)
            print_error "Serviço desconhecido: $service"
            echo "Opções: all, postgres, sql, frontend, nginx"
            ;;
    esac
}

# ============================================
# Comando: health
# ============================================

health() {
    print_info "Testando health checks..."
    echo ""
    
    echo -n "Frontend (80):           "
    curl -s http://localhost/health > /dev/null && print_success "OK" || print_error "FAIL"
    
    echo -n "Backend SQL (3001):      "
    curl -s http://localhost:3001/health > /dev/null && print_success "OK" || print_error "FAIL"
    
    echo -n "Backend Postgres (3002): "
    curl -s http://localhost:3002/health > /dev/null && print_success "OK" || print_error "FAIL"
    
    echo ""
    echo "Respostas JSON:"
    echo ""
    
    print_info "Backend SQL:"
    curl -s http://localhost:3001/health | jq . 2>/dev/null || print_error "Não conseguiu conectar"
    echo ""
    
    print_info "Backend Postgres:"
    curl -s http://localhost:3002/health | jq . 2>/dev/null || print_error "Não conseguiu conectar"
    echo ""
}

# ============================================
# Comando: start
# ============================================

start() {
    print_info "Iniciando containers..."
    docker-compose up -d
    
    print_info "Aguardando serviços ficarem saudáveis..."
    sleep 5
    
    status
}

# ============================================
# Comando: stop
# ============================================

stop() {
    print_warning "Parando containers graciosamente..."
    docker-compose down
    print_success "Containers parados"
}

# ============================================
# Comando: restart
# ============================================

restart() {
    local service=${1:-all}
    
    if [ "$service" = "all" ]; then
        print_warning "Reiniciando todos os serviços..."
        docker-compose restart
    else
        print_warning "Reiniciando $service..."
        docker-compose restart "$service"
    fi
    
    print_success "Reiniciado com sucesso"
    sleep 2
    status
}

# ============================================
# Comando: rebuild
# ============================================

rebuild() {
    print_warning "Reconstruindo containers..."
    docker-compose up -d --build
    print_success "Containers reconstruídos"
    sleep 3
    status
}

# ============================================
# Comando: clean
# ============================================

clean() {
    print_warning "Limpando volumes e containers parados..."
    docker-compose down -v
    print_success "Limpeza concluída"
}

# ============================================
# Comando: shell
# ============================================

shell() {
    local service=${1:-backend-postgres}
    print_info "Abrindo shell no $service..."
    docker-compose exec "$service" sh
}

# ============================================
# Comando: test-db
# ============================================

test_db() {
    print_info "Testando conexão com banco de dados..."
    docker-compose exec backend-postgres curl -s http://localhost:3002/api/test | jq . || print_error "Erro na conexão"
}

# ============================================
# Comando: memory
# ============================================

memory() {
    print_info "Uso de memória dos containers:"
    docker stats --no-stream \
        delta-frontend \
        delta-backend-sql \
        delta-backend-postgres \
        delta-nginx
}

# ============================================
# Comando: help
# ============================================

help() {
    cat << EOF

Uso: ./docker-manage.sh [comando] [opções]

Comandos:
    start           Inicia todos os serviços
    stop            Para todos os serviços graciosamente
    restart [svc]   Reinicia serviço (ou todos)
    status          Mostra status dos containers
    logs [svc]      Mostra logs (postgres|sql|frontend|nginx|all)
    health          Testa health checks dos serviços
    shell [svc]     Abre shell em um container
    rebuild         Reconstrói todos os containers
    clean           Remove containers e volumes
    memory          Mostra uso de memória
    test-db         Testa conexão com banco
    help            Mostra esta mensagem

Exemplos:
    ./docker-manage.sh status                   # Ver status
    ./docker-manage.sh logs postgres            # Ver logs do PostgreSQL
    ./docker-manage.sh restart backend-postgres # Reiniciar serviço
    ./docker-manage.sh health                   # Testar saúde
    ./docker-manage.sh memory                   # Ver memória

EOF
}

# ============================================
# Main
# ============================================

print_header

if [ -z "$1" ]; then
    help
    exit 0
fi

case "$1" in
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        restart "$2"
        ;;
    status)
        status
        ;;
    logs)
        logs "$2"
        ;;
    health)
        health
        ;;
    shell)
        shell "$2"
        ;;
    rebuild)
        rebuild
        ;;
    clean)
        clean
        ;;
    memory)
        memory
        ;;
    test-db)
        test_db
        ;;
    help|--help|-h)
        help
        ;;
    *)
        print_error "Comando desconhecido: $1"
        help
        exit 1
        ;;
esac

echo ""
