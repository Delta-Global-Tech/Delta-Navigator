#!/bin/bash

# Script de Deploy para OpenShift - Data Corban Navigator
# Uso: ./deploy-openshift.sh [ambiente]

set -e

# Configurações
NAMESPACE="data-corban-navigator"
APP_NAME="data-corban-navigator"
REGISTRY="quay.io/seu-usuario"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funções
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar se oc está instalado
check_prerequisites() {
    log_info "Verificando pré-requisitos..."
    
    if ! command -v oc &> /dev/null; then
        log_error "oc CLI não encontrado. Instale o OpenShift CLI."
        exit 1
    fi
    
    if ! oc whoami &> /dev/null; then
        log_error "Não está logado no OpenShift. Execute: oc login"
        exit 1
    fi
    
    log_success "Pré-requisitos verificados"
}

# Criar namespace se não existir
create_namespace() {
    log_info "Criando namespace $NAMESPACE..."
    
    if oc get namespace $NAMESPACE &> /dev/null; then
        log_warn "Namespace $NAMESPACE já existe"
    else
        oc create namespace $NAMESPACE
        log_success "Namespace $NAMESPACE criado"
    fi
    
    oc project $NAMESPACE
}

# Build das imagens
build_images() {
    log_info "Iniciando build das imagens..."
    
    # Frontend
    log_info "Building frontend..."
    oc new-build --name=${APP_NAME}-frontend \
        --git-repo=https://github.com/2carllos/data-corban-navigator.git \
        --context-dir=. \
        --strategy=docker \
        --to=${APP_NAME}-frontend:latest || true
    
    # SQL Backend
    log_info "Building SQL backend..."
    oc new-build --name=${APP_NAME}-sql-backend \
        --git-repo=https://github.com/2carllos/data-corban-navigator.git \
        --context-dir=server \
        --strategy=docker \
        --to=${APP_NAME}-sql-backend:latest || true
    
    # PostgreSQL Backend
    log_info "Building PostgreSQL backend..."
    oc new-build --name=${APP_NAME}-postgres-backend \
        --git-repo=https://github.com/2carllos/data-corban-navigator.git \
        --context-dir=postgres-server \
        --strategy=docker \
        --to=${APP_NAME}-postgres-backend:latest || true
    
    log_success "Builds iniciados"
}

# Aguardar builds
wait_for_builds() {
    log_info "Aguardando conclusão dos builds..."
    
    oc logs -f build/${APP_NAME}-frontend-1 &
    oc logs -f build/${APP_NAME}-sql-backend-1 &
    oc logs -f build/${APP_NAME}-postgres-backend-1 &
    
    wait
    
    log_success "Builds concluídos"
}

# Aplicar configurações
apply_configs() {
    log_info "Aplicando configurações..."
    
    # Verificar se arquivo existe
    if [ ! -f "openshift/configmap.yaml" ]; then
        log_error "Arquivo openshift/configmap.yaml não encontrado"
        exit 1
    fi
    
    # Aplicar arquivos YAML
    oc apply -f openshift/configmap.yaml
    oc apply -f openshift/security-policies.yaml || log_warn "Security policies podem falhar se não tiver permissões admin"
    
    log_success "Configurações aplicadas"
}

# Deploy da aplicação
deploy_app() {
    log_info "Deployando aplicação..."
    
    # Aplicar template
    oc process -f openshift/template.yaml \
        -p APPLICATION_NAME=$APP_NAME \
        -p GIT_URI=https://github.com/2carllos/data-corban-navigator.git \
        -p SUPABASE_URL=https://tgdvaaprejaojcwzgzng.supabase.co \
        -p SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnZHZhYXByZWphb2pjd3pnem5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NjYxODIsImV4cCI6MjA3MTQ0MjE4Mn0.Z80j00gTMk89yjHdlUNKaCjrTb1eB8dKbAEzgsIVqG8" \
        -p SQLSERVER_PASSWORD="SUA_SENHA_SQL" \
        -p POSTGRES_PASSWORD="SUA_SENHA_POSTGRES" \
        | oc apply -f -
    
    log_success "Aplicação deployada"
}

# Verificar status
check_status() {
    log_info "Verificando status da aplicação..."
    
    # Aguardar deployments
    oc rollout status deployment/${APP_NAME}-frontend --timeout=300s
    oc rollout status deployment/${APP_NAME}-sql-backend --timeout=300s
    oc rollout status deployment/${APP_NAME}-postgres-backend --timeout=300s
    
    # Mostrar pods
    log_info "Status dos pods:"
    oc get pods -l app=$APP_NAME
    
    # Mostrar serviços
    log_info "Status dos serviços:"
    oc get services -l app=$APP_NAME
    
    # Mostrar routes
    log_info "Routes da aplicação:"
    oc get routes -l app=$APP_NAME
    
    log_success "Deploy concluído com sucesso!"
}

# Mostrar URLs
show_urls() {
    log_info "URLs da aplicação:"
    
    FRONTEND_URL=$(oc get route ${APP_NAME}-frontend -o jsonpath='{.spec.host}' 2>/dev/null || echo "N/A")
    SQL_URL=$(oc get route ${APP_NAME}-sql-backend -o jsonpath='{.spec.host}' 2>/dev/null || echo "N/A")
    POSTGRES_URL=$(oc get route ${APP_NAME}-postgres-backend -o jsonpath='{.spec.host}' 2>/dev/null || echo "N/A")
    
    echo -e "${GREEN}Frontend:${NC} https://$FRONTEND_URL"
    echo -e "${GREEN}SQL API:${NC} https://$SQL_URL"
    echo -e "${GREEN}PostgreSQL API:${NC} https://$POSTGRES_URL"
}

# Cleanup (opcional)
cleanup() {
    log_warn "Removendo aplicação..."
    oc delete all -l app=$APP_NAME
    oc delete configmap -l app=$APP_NAME
    oc delete secret -l app=$APP_NAME
    log_success "Aplicação removida"
}

# Menu principal
main() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║              Data Corban Navigator - OpenShift              ║"
    echo "║                     Deploy Script                           ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    case "${1:-deploy}" in
        "deploy")
            check_prerequisites
            create_namespace
            apply_configs
            deploy_app
            check_status
            show_urls
            ;;
        "build")
            check_prerequisites
            create_namespace
            build_images
            wait_for_builds
            ;;
        "status")
            check_status
            show_urls
            ;;
        "cleanup")
            cleanup
            ;;
        "help"|"-h"|"--help")
            echo "Uso: $0 [comando]"
            echo ""
            echo "Comandos:"
            echo "  deploy   - Deploy completo (padrão)"
            echo "  build    - Apenas build das imagens"
            echo "  status   - Verificar status"
            echo "  cleanup  - Remover aplicação"
            echo "  help     - Mostrar ajuda"
            ;;
        *)
            log_error "Comando inválido: $1"
            echo "Use '$0 help' para ver os comandos disponíveis"
            exit 1
            ;;
    esac
}

# Executar
main "$@"
