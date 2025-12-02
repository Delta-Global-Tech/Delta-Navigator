#!/usr/bin/env pwsh
# Delta Navigator - Test Suite
# Testa todos os 6 serviços

Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║        DELTA NAVIGATOR - TESTE DE SAÚDE DOS SERVIÇOS           ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Array de serviços
$services = @(
    @{ name = "Frontend"; port = 80; endpoint = "/health" },
    @{ name = "Backend Server"; port = 3001; endpoint = "/health" },
    @{ name = "Postgres Server"; port = 3002; endpoint = "/health" },
    @{ name = "Extrato Server"; port = 3003; endpoint = "/health" },
    @{ name = "Contratos Server"; port = 3004; endpoint = "/health" },
    @{ name = "Iugu Server"; port = 3005; endpoint = "/health" }
)

$passed = 0
$failed = 0

# Teste cada serviço
foreach ($service in $services) {
    Write-Host "Testing $($service.name) (port $($service.port))..." -ForegroundColor Yellow -NoNewline
    
    try {
        $url = "http://localhost:$($service.port)$($service.endpoint)"
        $response = Invoke-WebRequest -Uri $url -TimeoutSec 5 -SkipHttpErrorCheck
        
        if ($response.StatusCode -eq 200) {
            Write-Host " ✅ ONLINE" -ForegroundColor Green
            $passed++
            
            # Parse JSON if available
            try {
                $json = $response.Content | ConvertFrom-Json
                Write-Host "  Status: $($json.status)" -ForegroundColor Green
                if ($json.database) {
                    Write-Host "  Database: $($json.database)" -ForegroundColor Green
                }
            } catch {
                # Silently ignore if not JSON
            }
        } else {
            Write-Host " ⚠️  OFFLINE (Code: $($response.StatusCode))" -ForegroundColor Red
            $failed++
        }
    } catch {
        Write-Host " ❌ OFFLINE" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor DarkRed
        $failed++
    }
}

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                         RESUMO DOS TESTES                       ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Write-Host "  Serviços Online:  $passed/6" -ForegroundColor Green
Write-Host "  Serviços Offline: $failed/6" -ForegroundColor Red
Write-Host ""

if ($failed -eq 0) {
    Write-Host "  ✅ TODOS OS SERVIÇOS ESTÃO SAUDÁVEIS!" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Próximos passos:" -ForegroundColor Cyan
    Write-Host "    1. Frontend disponível em http://localhost" -ForegroundColor Cyan
    Write-Host "    2. APIs esperando requisições" -ForegroundColor Cyan
    Write-Host "    3. Banco de dados conectado e operacional" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host "  ❌ ALGUNS SERVIÇOS ESTÃO OFFLINE" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Solução:" -ForegroundColor Yellow
    Write-Host "    1. Aguarde 30-40 segundos após iniciar" -ForegroundColor Yellow
    Write-Host "    2. Execute novamente este teste" -ForegroundColor Yellow
    Write-Host "    3. Se persistir, verifique: docker-compose logs" -ForegroundColor Yellow
    Write-Host ""
}

# Teste Docker Compose
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                   STATUS DOS CONTAINERS DOCKER                 ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

try {
    $output = & docker-compose -f docker-compose-all.yml ps --no-trunc
    Write-Host $output
} catch {
    Write-Host "⚠️  Docker Compose não encontrado. Inicie com:" -ForegroundColor Yellow
    Write-Host "   docker-compose -f docker-compose-all.yml up -d" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Teste concluído em $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Gray
