#!/usr/bin/env powershell
# Script para testar os endpoints do servidor IUGU

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Teste de Endpoints - Servidor IUGU" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3005"

# Função para fazer requisições
function Test-Endpoint {
    param(
        [string]$name,
        [string]$endpoint,
        [string]$method = "GET"
    )
    
    Write-Host "🔍 Testando: $name" -ForegroundColor Yellow
    Write-Host "   URL: $baseUrl$endpoint" -ForegroundColor Gray
    
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl$endpoint" -Method $method -ErrorAction Stop
        Write-Host "   ✅ Status: $($response.StatusCode)" -ForegroundColor Green
        
        # Mostrar primeiros 200 caracteres da resposta
        $body = $response.Content | ConvertFrom-Json
        $bodyStr = $body | ConvertTo-Json -Depth 1
        if ($bodyStr.Length -gt 200) {
            Write-Host "   Resposta: $($bodyStr.Substring(0, 200))..." -ForegroundColor Green
        } else {
            Write-Host "   Resposta: $bodyStr" -ForegroundColor Green
        }
    } catch {
        Write-Host "   ❌ Erro: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
}

# Verificar se o servidor está rodando
Write-Host "Verificando se o servidor está rodando..." -ForegroundColor Cyan
try {
    $testResponse = Invoke-WebRequest -Uri "$baseUrl/health" -ErrorAction Stop
    Write-Host "✅ Servidor está rodando!" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Servidor não está respondendo em $baseUrl" -ForegroundColor Red
    Write-Host "Inicie com: cd iugu-server && npm start" -ForegroundColor Yellow
    exit 1
}

# Testar endpoints
Test-Endpoint "Health Check" "/health"
Test-Endpoint "Teste de Conexão" "/api/test"
Test-Endpoint "Listar Boletos" "/api/bank-slips"
Test-Endpoint "Estatísticas" "/api/bank-slips/stats"
Test-Endpoint "Boletos Pagos" "/api/bank-slips/by-status/paid"
Test-Endpoint "Boletos Abertos" "/api/bank-slips/by-status/open"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Testes concluídos!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
