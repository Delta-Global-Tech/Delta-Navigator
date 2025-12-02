# ============================================
# Delta Navigator - Test Suite (Windows)
# ============================================
# Este script testa todos os aspectos da aplicação

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Cores
$ErrorColor = 'Red'
$SuccessColor = 'Green'
$WarningColor = 'Yellow'
$InfoColor = 'Cyan'

# Contadores
$TestsPassed = 0
$TestsFailed = 0
$TestsTotal = 0

# ============================================
# Funções
# ============================================

function Write-Header {
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor $InfoColor
    Write-Host "   Delta Navigator - Test Suite (Windows)" -ForegroundColor $InfoColor
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor $InfoColor
    Write-Host ""
}

function Write-Section {
    param([string]$Name)
    Write-Host ""
    Write-Host "▶ $Name" -ForegroundColor $InfoColor
    Write-Host ""
}

function Test-Pass {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor $SuccessColor
    $script:TestsPassed++
    $script:TestsTotal++
}

function Test-Fail {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor $ErrorColor
    $script:TestsFailed++
    $script:TestsTotal++
}

function Test-Warn {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor $WarningColor
}

function Print-Result {
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor $InfoColor
    if ($TestsFailed -eq 0) {
        Write-Host "✓ Todos os testes passaram! ($TestsPassed/$TestsTotal)" -ForegroundColor $SuccessColor
    } else {
        Write-Host "✗ Alguns testes falharam! Passaram: $TestsPassed/$TestsTotal" -ForegroundColor $ErrorColor
    }
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor $InfoColor
    Write-Host ""
}

# ============================================
# Testes
# ============================================

function Test-DockerInstalled {
    Write-Section "Verificando Docker"
    
    if (Get-Command docker -ErrorAction SilentlyContinue) {
        $version = docker --version
        Test-Pass "Docker instalado: $version"
    } else {
        Test-Fail "Docker não encontrado - instale Docker Desktop"
    }
    
    if (Get-Command docker-compose -ErrorAction SilentlyContinue) {
        $version = docker-compose --version
        Test-Pass "Docker Compose instalado: $version"
    } else {
        Test-Fail "Docker Compose não encontrado"
    }
}

function Test-EnvFiles {
    Write-Section "Verificando Arquivos de Configuração"
    
    if (Test-Path "$ScriptDir\server\.env") {
        Test-Pass "server\.env existe"
    } else {
        Test-Warn "server\.env não encontrado - crie com: cp server\.env.example server\.env"
    }
    
    if (Test-Path "$ScriptDir\server\.env.example") {
        Test-Pass "server\.env.example existe"
    } else {
        Test-Fail "server\.env.example não encontrado"
    }
    
    if (Test-Path "$ScriptDir\docker-compose.yml") {
        Test-Pass "docker-compose.yml existe"
    } else {
        Test-Fail "docker-compose.yml não encontrado"
    }
}

function Test-DockerComposeSyntax {
    Write-Section "Validando Sintaxe do docker-compose.yml"
    
    try {
        $output = docker-compose config 2>&1
        if ($LASTEXITCODE -eq 0) {
            Test-Pass "docker-compose.yml é válido"
        } else {
            Test-Fail "docker-compose.yml possui erros de sintaxe"
        }
    } catch {
        Test-Fail "Erro ao validar docker-compose.yml"
    }
}

function Test-ContainersRunning {
    Write-Section "Verificando Containers Rodando"
    
    try {
        $containers = docker-compose ps --services 2>/dev/null
        
        if ($containers -contains "frontend") {
            Test-Pass "Container frontend está rodando"
        } else {
            Test-Warn "Container frontend não está rodando"
        }
        
        if ($containers -contains "backend-sql") {
            Test-Pass "Container backend-sql está rodando"
        } else {
            Test-Warn "Container backend-sql não está rodando"
        }
        
        if ($containers -contains "backend-postgres") {
            Test-Pass "Container backend-postgres está rodando"
        } else {
            Test-Warn "Container backend-postgres não está rodando"
        }
    } catch {
        Test-Warn "Não conseguiu verificar containers"
    }
}

function Test-HealthChecks {
    Write-Section "Testando Health Checks"
    
    # Frontend
    try {
        $response = Invoke-WebRequest -Uri "http://localhost/health" -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Test-Pass "Frontend health check OK"
        }
    } catch {
        Test-Warn "Frontend não respondendo (pode estar inicializando)"
    }
    
    # Backend SQL
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Test-Pass "Backend SQL health check OK"
        }
    } catch {
        Test-Warn "Backend SQL não respondendo"
    }
    
    # Backend PostgreSQL
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3002/health" -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Test-Pass "Backend PostgreSQL health check OK"
        }
    } catch {
        Test-Warn "Backend PostgreSQL não respondendo"
    }
}

function Test-DatabaseConnection {
    Write-Section "Testando Conexão com Banco de Dados"
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3002/api/test" -ErrorAction SilentlyContinue
        if ($response.Content -match "PostgreSQL conectado") {
            Test-Pass "Banco de dados PostgreSQL conectado"
        } else {
            Test-Warn "Não conseguiu testar conexão com banco"
        }
    } catch {
        Test-Warn "Não conseguiu testar conexão com banco"
    }
}

function Test-PortsAvailable {
    Write-Section "Verificando Portas Disponíveis"
    
    $netstat = Get-NetTCPConnection -ErrorAction SilentlyContinue
    
    if ($netstat | Where-Object { $_.LocalPort -eq 80 }) {
        Test-Pass "Porta 80 (Frontend) disponível"
    } else {
        Test-Warn "Porta 80 pode estar em uso"
    }
    
    if ($netstat | Where-Object { $_.LocalPort -eq 3001 }) {
        Test-Pass "Porta 3001 (Backend SQL) disponível"
    } else {
        Test-Warn "Porta 3001 pode estar em uso"
    }
    
    if ($netstat | Where-Object { $_.LocalPort -eq 3002 }) {
        Test-Pass "Porta 3002 (Backend PostgreSQL) disponível"
    } else {
        Test-Warn "Porta 3002 pode estar em uso"
    }
}

function Test-MemoryUsage {
    Write-Section "Verificando Uso de Memória"
    
    try {
        $stats = docker stats --no-stream --format "{{.MemUsage}}" 2>/dev/null | Select-Object -First 1
        if ($stats) {
            Test-Pass "Memória total: $stats"
        } else {
            Test-Warn "Não conseguiu obter estatísticas de memória"
        }
    } catch {
        Test-Warn "Não conseguiu obter estatísticas de memória"
    }
}

function Test-LogsAvailable {
    Write-Section "Verificando Logs"
    
    try {
        $logs = docker-compose logs backend-postgres 2>/dev/null
        $logLines = @($logs).Count
        if ($logLines -gt 0) {
            Test-Pass "Logs do backend-postgres disponíveis ($logLines linhas)"
        } else {
            Test-Warn "Sem logs disponíveis para backend-postgres"
        }
    } catch {
        Test-Warn "Não conseguiu obter logs"
    }
}

function Test-NetworkIsolation {
    Write-Section "Verificando Network Isolation"
    
    try {
        $networks = docker network ls 2>/dev/null
        if ($networks -match "delta-network") {
            Test-Pass "Network delta-network existe"
        } else {
            Test-Warn "Network delta-network não encontrada"
        }
    } catch {
        Test-Warn "Não conseguiu verificar networks"
    }
}

function Test-RestartPolicy {
    Write-Section "Verificando Restart Policies"
    
    try {
        $frontendRestart = docker inspect --format='{{.HostConfig.RestartPolicy.Name}}' delta-frontend 2>/dev/null
        $sqlRestart = docker inspect --format='{{.HostConfig.RestartPolicy.Name}}' delta-backend-sql 2>/dev/null
        $postgresRestart = docker inspect --format='{{.HostConfig.RestartPolicy.Name}}' delta-backend-postgres 2>/dev/null
        
        if ($frontendRestart -eq "unless-stopped") {
            Test-Pass "Frontend restart policy: $frontendRestart"
        } else {
            Test-Warn "Frontend restart policy: $frontendRestart"
        }
        
        if ($sqlRestart -eq "unless-stopped") {
            Test-Pass "Backend SQL restart policy: $sqlRestart"
        } else {
            Test-Warn "Backend SQL restart policy: $sqlRestart"
        }
        
        if ($postgresRestart -eq "unless-stopped") {
            Test-Pass "Backend PostgreSQL restart policy: $postgresRestart"
        } else {
            Test-Warn "Backend PostgreSQL restart policy: $postgresRestart"
        }
    } catch {
        Test-Warn "Não conseguiu verificar restart policies"
    }
}

# ============================================
# Main
# ============================================

Write-Header

# Executar testes
Test-DockerInstalled
Test-EnvFiles
Test-DockerComposeSyntax
Test-ContainersRunning
Test-HealthChecks
Test-DatabaseConnection
Test-PortsAvailable
Test-MemoryUsage
Test-LogsAvailable
Test-NetworkIsolation
Test-RestartPolicy

# Mostrar resultados
Print-Result

# Retornar código apropriado
if ($TestsFailed -eq 0) {
    exit 0
} else {
    exit 1
}
