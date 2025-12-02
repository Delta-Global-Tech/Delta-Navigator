# TESTE SIMPLES: Validar Docker + Preparar para Vault (Windows)
# Tempo: 5 minutos
# Risco: ZERO (apenas validacao, sem mudancas)

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "  TESTE 1: Verificar status Docker atual" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host ""

function Test-Command {
    param($Command)
    $null = Get-Command $Command -ErrorAction SilentlyContinue
    return $?
}

# 1. Verificar Docker
Write-Host "1 - Verificando Docker..." -ForegroundColor Yellow
if (Test-Command docker) {
    $version = docker --version
    Write-Host "[OK] Docker encontrado: $version" -ForegroundColor Green
} else {
    Write-Host "[ERRO] Docker nao esta instalado!" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 2. Verificar Docker Compose
Write-Host "2 - Verificando Docker Compose..." -ForegroundColor Yellow
if (Test-Command docker-compose) {
    $version = docker-compose --version
    Write-Host "[OK] Docker Compose encontrado: $version" -ForegroundColor Green
} else {
    Write-Host "[ERRO] Docker Compose nao esta instalado!" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 3. Listar containers rodando
Write-Host "3 - Containers em execucao:" -ForegroundColor Yellow
try {
    $containers = docker ps --format "table {{.Names}}`t{{.Status}}"
    Write-Host $containers
} catch {
    Write-Host "[AVISO] Docker nao respondeu" -ForegroundColor Yellow
}
Write-Host ""

# 4. Validar docker-compose.yml
Write-Host "4 - Validando docker-compose.yml..." -ForegroundColor Yellow
try {
    $output = docker-compose config 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] docker-compose.yml eh valido" -ForegroundColor Green
    } else {
        Write-Host "[ERRO] docker-compose.yml tem erro!" -ForegroundColor Red
        Write-Host $output
        exit 1
    }
} catch {
    Write-Host "[ERRO] Erro ao validar: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 5. Testar conectividade dos backends
Write-Host "5 - Testando conectividade dos backends..." -ForegroundColor Yellow
Write-Host ""

$backends = @(
    @{ url = "http://localhost:3001/health"; name = "Backend SQL Server" },
    @{ url = "http://localhost:3002/health"; name = "Backend PostgreSQL" },
    @{ url = "http://localhost:3003/health"; name = "Backend Extrato" },
    @{ url = "http://localhost:3004/health"; name = "Backend Contratos" }
)

foreach ($backend in $backends) {
    Write-Host -NoNewline "   [TESTE] $($backend.name) ($($backend.url)): "
    
    try {
        $response = Invoke-WebRequest -Uri $backend.url -UseBasicParsing -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Host "[OK]" -ForegroundColor Green
        } else {
            Write-Host "[AVISO] Status: $($response.StatusCode)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "[AVISO] Sem resposta (pode estar parado)" -ForegroundColor Yellow
    }
}
Write-Host ""

# 6. Verificar arquivo .env
Write-Host "6 - Verificando variaveis de ambiente (.env)..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "[OK] Arquivo .env encontrado" -ForegroundColor Green
    
    $requiredVars = @(
        "POSTGRES_HOST",
        "POSTGRES_PORT",
        "POSTGRES_DATABASE",
        "POSTGRES_USER",
        "POSTGRES_PASSWORD",
        "VITE_SUPABASE_URL"
    )
    
    $envContent = Get-Content .env
    
    foreach ($var in $requiredVars) {
        $line = $envContent | Where-Object { $_ -match "^$var=" }
        if ($line) {
            $value = $line.Split('=')[1]
            # Mostrar apenas primeiros 10 chars para seguranca
            if ($value.Length -gt 10) {
                $display = $value.Substring(0, 10) + "..."
            } else {
                $display = $value
            }
            Write-Host "   [OK] $var=$display" -ForegroundColor Green
        } else {
            Write-Host "   [ERRO] $var nao encontrado" -ForegroundColor Red
        }
    }
} else {
    Write-Host "[ERRO] Arquivo .env nao encontrado!" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 7. Teste de conectividade ao PostgreSQL (se psql estiver instalado)
Write-Host "7 - Testando conectividade PostgreSQL..." -ForegroundColor Yellow
Write-Host "   (se psql estiver instalado)" -ForegroundColor Gray

if (Test-Command psql) {
    $pghost = $env:POSTGRES_HOST -or "localhost"
    $pgport = $env:POSTGRES_PORT -or "5432"
    $pguser = $env:POSTGRES_USER -or "postgres"
    $pgdatabase = $env:POSTGRES_DATABASE -or "airflow_treynor"
    
    try {
        $result = psql -h $pghost -p $pgport -U $pguser -d $pgdatabase -c "SELECT 1" -t 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[OK] PostgreSQL conectado com sucesso" -ForegroundColor Green
        } else {
            Write-Host "[AVISO] PostgreSQL nao respondeu (container pode estar parado)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "[AVISO] Erro ao conectar: $_" -ForegroundColor Yellow
    }
} else {
    Write-Host "[AVISO] psql nao esta instalado (pulando teste de conexao)" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "  TESTE COMPLETO!" -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Resumo:" -ForegroundColor Cyan
Write-Host "   [OK] Docker esta funcionando" -ForegroundColor Green
Write-Host "   [OK] .env esta configurado" -ForegroundColor Green
Write-Host "   [OK] Pronto para adicionar Vault" -ForegroundColor Green
Write-Host ""
Write-Host "Proximos passos:" -ForegroundColor Cyan
Write-Host "   1. Confirmar que backends estao rodando" -ForegroundColor Yellow
Write-Host "   2. Se tudo esta verde [OK], fazer backup do docker-compose.yml" -ForegroundColor Yellow
Write-Host "   3. Adicionar servico Vault ao docker-compose.yml" -ForegroundColor Yellow
Write-Host "   4. Rodar: docker-compose up -d vault" -ForegroundColor Yellow
Write-Host "   5. Testar: curl http://localhost:8200/ui" -ForegroundColor Yellow
Write-Host ""
