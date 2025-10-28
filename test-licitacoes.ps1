#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Script para testar os endpoints de Licitações (Iugu)

.DESCRIPTION
    Testa a conectividade e funcionalidade da API de boletos bancários

.EXAMPLE
    .\test-licitacoes.ps1
#>

param(
    [string]$BaseUrl = "http://localhost:3002",
    [switch]$Verbose
)

$ErrorActionPreference = "Continue"

function Write-Header {
    param([string]$Text)
    Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║ $Text" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
}

function Write-Test {
    param([string]$Text)
    Write-Host "`n📋 $Text" -ForegroundColor Yellow
}

function Write-Success {
    param([string]$Text)
    Write-Host "✅ $Text" -ForegroundColor Green
}

function Write-Error {
    param([string]$Text)
    Write-Host "❌ $Text" -ForegroundColor Red
}

function Write-Info {
    param([string]$Text)
    Write-Host "ℹ️  $Text" -ForegroundColor Blue
}

Write-Header "TESTE DE API - LICITAÇÕES (IUGU)"

# Teste 1: Conectividade Básica
Write-Test "Teste 1: Verificar conectividade básica com servidor"

try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/api/test" -Method Get -TimeoutSec 10 -ErrorAction Stop
    $data = $response.Content | ConvertFrom-Json
    Write-Success "Servidor respondendo"
    Write-Info "Status: $($response.StatusCode)"
    Write-Info "Hora do servidor: $($data.time)"
} catch {
    Write-Error "Servidor não está acessível: $_"
    Write-Info "Verifique se o servidor está rodando com: npm run server:postgres"
    exit 1
}

# Teste 2: Buscar Boletos Bancários
Write-Test "Teste 2: Buscar boletos bancários"

try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/api/licitacoes/bank-slips" -Method Get -TimeoutSec 30 -ErrorAction Stop
    $data = $response.Content | ConvertFrom-Json
    
    Write-Success "Boletos carregados com sucesso"
    Write-Info "Total de boletos: $($data.count)"
    Write-Info "Data/Hora da consulta: $($data.timestamp)"
    
    if ($data.data.Count -gt 0) {
        Write-Info "Primeiros 3 registros:"
        $data.data | Select-Object -First 3 | ForEach-Object {
            Write-Host "  - Cliente: $($_.client_name)"
            Write-Host "    Processador: $($_.processor_type)"
            Write-Host "    Valor: R$ $([decimal]::Parse($_.amount).ToString('F2'))"
            Write-Host "    Status: $($_.status)"
            Write-Host ""
        }
    } else {
        Write-Info "Nenhum boleto encontrado na base de dados"
    }
} catch {
    Write-Error "Erro ao buscar boletos: $_"
}

# Teste 3: Buscar Estatísticas
Write-Test "Teste 3: Buscar estatísticas de boletos"

try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/api/licitacoes/bank-slips/stats" -Method Get -TimeoutSec 30 -ErrorAction Stop
    $data = $response.Content | ConvertFrom-Json
    
    Write-Success "Estatísticas carregadas com sucesso"
    Write-Info "Total de boletos: $($data.total_count)"
    Write-Info "Boletos pagos: $($data.paid_count)"
    Write-Info "Boletos abertos: $($data.open_count)"
    Write-Info "Boletos cancelados: $($data.canceled_count)"
    Write-Info "Valor total: R$ $([decimal]::Parse($data.total_amount).ToString('F2'))"
    Write-Info "Valor líquido: R$ $([decimal]::Parse($data.total_paid_net).ToString('F2'))"
    Write-Info "Total de taxas: R$ $([decimal]::Parse($data.total_fees).ToString('F2'))"
    Write-Info "Taxa média: R$ $([decimal]::Parse($data.avg_fee).ToString('F2'))"
} catch {
    Write-Error "Erro ao buscar estatísticas: $_"
}

# Teste 4: Performance
Write-Test "Teste 4: Teste de performance (5 requisições)"

try {
    $times = @()
    for ($i = 1; $i -le 5; $i++) {
        $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
        $response = Invoke-WebRequest -Uri "$BaseUrl/api/licitacoes/bank-slips" -Method Get -TimeoutSec 30 -ErrorAction Stop
        $stopwatch.Stop()
        $times += $stopwatch.ElapsedMilliseconds
        Write-Info "Requisição $i: $($stopwatch.ElapsedMilliseconds)ms"
    }
    
    $avgTime = [math]::Round(($times | Measure-Object -Average).Average, 2)
    $maxTime = ($times | Measure-Object -Maximum).Maximum
    $minTime = ($times | Measure-Object -Minimum).Minimum
    
    Write-Success "Performance:"
    Write-Info "  Tempo médio: ${avgTime}ms"
    Write-Info "  Tempo mínimo: ${minTime}ms"
    Write-Info "  Tempo máximo: ${maxTime}ms"
} catch {
    Write-Error "Erro durante teste de performance: $_"
}

# Teste 5: Verificação de Banco de Dados
Write-Test "Teste 5: Verificar credenciais do banco de dados"

Write-Info "Banco configurado:"
Write-Info "  Host: 10.174.1.117"
Write-Info "  Porta: 5432"
Write-Info "  Banco: ntxdeltaglobal"
Write-Info "  Usuário: postgres"

Write-Info "Para conectar manualmente:"
Write-Info "  psql -h 10.174.1.117 -p 5432 -U postgres -d ntxdeltaglobal"

# Resumo Final
Write-Header "RESUMO DOS TESTES"

Write-Host "`n✨ Testes concluídos!`n" -ForegroundColor Green
Write-Host "Próximas etapas:`n" -ForegroundColor Cyan
Write-Host "1. Acessar o frontend: http://localhost:5173"
Write-Host "2. Navegar para: Backoffice Delta → Licitações (Iugu)"
Write-Host "3. Verificar se os dados aparecem corretamente`n"

Write-Host "Documentação completa: LICITACOES_IUGU_DOCUMENTACAO.md`n" -ForegroundColor Cyan
