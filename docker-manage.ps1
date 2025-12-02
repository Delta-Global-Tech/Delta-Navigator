# ============================================
# Delta Navigator - Docker Management Script (Windows)
# ============================================
# Este script facilita o gerenciamento dos containers no Windows

param(
    [Parameter(Position=0)]
    [ValidateSet('start', 'stop', 'restart', 'status', 'logs', 'health', 'rebuild', 'clean', 'memory', 'test-db', 'help')]
    [string]$Command = 'help',
    
    [Parameter(Position=1)]
    [string]$Service
)

# Cores
$ErrorColor = 'Red'
$SuccessColor = 'Green'
$WarningColor = 'Yellow'
$InfoColor = 'Cyan'

function Write-Header {
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor $InfoColor
    Write-Host "   Delta Navigator - Docker Management (Windows)" -ForegroundColor $InfoColor
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor $InfoColor
    Write-Host ""
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor $SuccessColor
}

function Write-Error {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor $ErrorColor
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor $WarningColor
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ $Message" -ForegroundColor $InfoColor
}

# ============================================
# Comandos
# ============================================

function Start-Services {
    Write-Info "Iniciando containers..."
    docker-compose up -d
    
    Write-Info "Aguardando serviços ficarem saudáveis..."
    Start-Sleep -Seconds 5
    
    Show-Status
}

function Stop-Services {
    Write-Warning "Parando containers graciosamente..."
    docker-compose down
    Write-Success "Containers parados"
}

function Restart-Services {
    if ([string]::IsNullOrEmpty($Service) -or $Service -eq 'all') {
        Write-Warning "Reiniciando todos os serviços..."
        docker-compose restart
    } else {
        Write-Warning "Reiniciando $Service..."
        docker-compose restart $Service
    }
    
    Write-Success "Reiniciado com sucesso"
    Start-Sleep -Seconds 2
    Show-Status
}

function Show-Status {
    Write-Info "Status dos containers:"
    Write-Host ""
    docker-compose ps
    Write-Host ""
    
    Write-Info "Verificando health checks..."
    Write-Host ""
    
    try {
        $frontend = docker inspect --format='{{.State.Health.Status}}' delta-frontend 2>$null
        $sql = docker inspect --format='{{.State.Health.Status}}' delta-backend-sql 2>$null
        $postgres = docker inspect --format='{{.State.Health.Status}}' delta-backend-postgres 2>$null
        $nginx = docker inspect --format='{{.State.Health.Status}}' delta-nginx 2>$null
        
        Write-Host "Frontend:         $frontend"
        Write-Host "Backend SQL:      $sql"
        Write-Host "Backend Postgres: $postgres"
        Write-Host "Nginx:            $nginx"
    } catch {
        Write-Error "Não foi possível verificar health checks"
    }
    
    Write-Host ""
}

function Show-Logs {
    if ([string]::IsNullOrEmpty($Service) -or $Service -eq 'all') {
        Write-Info "Mostrando logs de todos os serviços..."
        docker-compose logs -f --tail=50
    } else {
        Write-Info "Mostrando logs do $Service..."
        docker-compose logs -f --tail=50 $Service
    }
}

function Test-Health {
    Write-Info "Testando health checks..."
    Write-Host ""
    
    # Frontend
    Write-Host -NoNewline "Frontend (80):           "
    try {
        $response = Invoke-WebRequest -Uri "http://localhost/health" -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Success "OK"
        } else {
            Write-Error "FAIL"
        }
    } catch {
        Write-Error "FAIL"
    }
    
    # Backend SQL
    Write-Host -NoNewline "Backend SQL (3001):      "
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Success "OK"
        } else {
            Write-Error "FAIL"
        }
    } catch {
        Write-Error "FAIL"
    }
    
    # Backend PostgreSQL
    Write-Host -NoNewline "Backend Postgres (3002): "
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3002/health" -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Success "OK"
        } else {
            Write-Error "FAIL"
        }
    } catch {
        Write-Error "FAIL"
    }
    
    Write-Host ""
    Write-Info "Respostas JSON:"
    Write-Host ""
    
    Write-Info "Backend SQL:"
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -ErrorAction SilentlyContinue
        $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
    } catch {
        Write-Error "Não conseguiu conectar"
    }
    Write-Host ""
    
    Write-Info "Backend PostgreSQL:"
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3002/health" -ErrorAction SilentlyContinue
        $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
    } catch {
        Write-Error "Não conseguiu conectar"
    }
    Write-Host ""
}

function Rebuild-Services {
    Write-Warning "Reconstruindo containers..."
    docker-compose up -d --build
    Write-Success "Containers reconstruídos"
    Start-Sleep -Seconds 3
    Show-Status
}

function Clean-Services {
    Write-Warning "Limpando volumes e containers parados..."
    docker-compose down -v
    Write-Success "Limpeza concluída"
}

function Show-Memory {
    Write-Info "Uso de memória dos containers:"
    Write-Host ""
    docker stats --no-stream `
        delta-frontend `
        delta-backend-sql `
        delta-backend-postgres `
        delta-nginx
}

function Test-Database {
    Write-Info "Testando conexão com banco de dados..."
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3002/api/test" -ErrorAction SilentlyContinue
        $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
    } catch {
        Write-Error "Erro na conexão"
    }
}

function Show-Help {
    $help = @"

Uso: .\docker-manage.ps1 [comando] [opções]

Comandos:
    start           Inicia todos os serviços
    stop            Para todos os serviços graciosamente
    restart [svc]   Reinicia serviço (ou todos)
    status          Mostra status dos containers
    logs [svc]      Mostra logs de um serviço
    health          Testa health checks dos serviços
    rebuild         Reconstrói todos os containers
    clean           Remove containers e volumes
    memory          Mostra uso de memória
    test-db         Testa conexão com banco
    help            Mostra esta mensagem

Serviços disponíveis:
    frontend, backend-sql, backend-postgres, nginx, all

Exemplos:
    .\docker-manage.ps1 status                        # Ver status
    .\docker-manage.ps1 logs backend-postgres         # Ver logs
    .\docker-manage.ps1 restart backend-postgres      # Reiniciar serviço
    .\docker-manage.ps1 health                        # Testar saúde
    .\docker-manage.ps1 memory                        # Ver memória

"@
    Write-Host $help
}

# ============================================
# Main
# ============================================

Write-Header

switch ($Command) {
    'start' { Start-Services }
    'stop' { Stop-Services }
    'restart' { Restart-Services }
    'status' { Show-Status }
    'logs' { Show-Logs }
    'health' { Test-Health }
    'rebuild' { Rebuild-Services }
    'clean' { Clean-Services }
    'memory' { Show-Memory }
    'test-db' { Test-Database }
    'help' { Show-Help }
    default { 
        Write-Error "Comando desconhecido: $Command"
        Show-Help
        exit 1
    }
}

Write-Host ""
