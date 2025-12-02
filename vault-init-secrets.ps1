#!/usr/bin/env pwsh
# Script para inicializar secrets no Vault

$VAULT_ADDR = "http://localhost:8200"
$VAULT_TOKEN = "devtoken"

$headers = @{
    "X-Vault-Token" = $VAULT_TOKEN
    "Content-Type" = "application/json"
}

Write-Host "🔐 Iniciando população COMPLETA de secrets no Vault..." -ForegroundColor Cyan
Write-Host "📍 Vault Address: $VAULT_ADDR" -ForegroundColor Gray
Write-Host ""

# Todos os secrets
$secrets = @(
    # ========== BACKEND SQL (server) ==========
    @{ path = "secret/data/delta/postgres-host"; value = "192.168.8.149" },
    @{ path = "secret/data/delta/postgres-port"; value = "5432" },
    @{ path = "secret/data/delta/postgres-db"; value = "airflow_treynor" },
    @{ path = "secret/data/delta/postgres-user"; value = "postgres" },
    @{ path = "secret/data/delta/postgres-password"; value = "MinhaSenh@123" },
    
    # ========== BACKEND POSTGRES (postgres-server) ==========
    @{ path = "secret/data/backend-postgres/host"; value = "10.174.1.117" },
    @{ path = "secret/data/backend-postgres/port"; value = "5432" },
    @{ path = "secret/data/backend-postgres/db"; value = "postgres" },
    @{ path = "secret/data/backend-postgres/user"; value = "postgres" },
    @{ path = "secret/data/backend-postgres/password"; value = "u8@UWlfV@mT8TjSVtcEJmOTd" },
    
    # ========== BACKEND EXTRATO (extrato-server) ==========
    @{ path = "secret/data/extrato/postgres-host"; value = "10.174.1.116" },
    @{ path = "secret/data/extrato/postgres-port"; value = "5432" },
    @{ path = "secret/data/extrato/postgres-db"; value = "paysmart" },
    @{ path = "secret/data/extrato/postgres-user"; value = "postgres" },
    @{ path = "secret/data/extrato/postgres-password"; value = "XwrNUm9YshZsdQxQ" },
    
    # ========== BACKEND IUGU (iugu-server) ==========
    @{ path = "secret/data/iugu/postgres-host"; value = "10.174.1.117" },
    @{ path = "secret/data/iugu/postgres-port"; value = "5432" },
    @{ path = "secret/data/iugu/postgres-db"; value = "ntxdeltaglobal" },
    @{ path = "secret/data/iugu/postgres-user"; value = "postgres" },
    @{ path = "secret/data/iugu/postgres-password"; value = "u8@UWlfV@mT8TjSVtcEJmOTd" },
    
    # ========== BACKEND CONTRATOS (contratos-server) ==========
    @{ path = "secret/data/contratos/postgres-host"; value = "10.174.1.116" },
    @{ path = "secret/data/contratos/postgres-port"; value = "5432" },
    @{ path = "secret/data/contratos/postgres-db"; value = "EM" },
    @{ path = "secret/data/contratos/postgres-user"; value = "postgres" },
    @{ path = "secret/data/contratos/postgres-password"; value = "XwrNUm9YshZsdQxQ" },
    
    # ========== SQL SERVER (Legacy) ==========
    @{ path = "secret/data/sqlserver/host"; value = "localhost" },
    @{ path = "secret/data/sqlserver/port"; value = "1433" },
    @{ path = "secret/data/sqlserver/user"; value = "sa" },
    @{ path = "secret/data/sqlserver/password"; value = "MinhaSenh@123" },
    @{ path = "secret/data/sqlserver/database"; value = "master" }
)

$created = 0
$failed = 0

# Criar cada secret
foreach ($secret in $secrets) {
    $uri = "$VAULT_ADDR/v1/$($secret.path)"
    $body = @{
        data = @{
            value = $secret.value
        }
    } | ConvertTo-Json
    
    try {
        Invoke-WebRequest -Uri $uri -Method POST -Headers $headers -Body $body | Out-Null
        Write-Host "✅ $($secret.path)" -ForegroundColor Green
        $created++
    }
    catch {
        Write-Host "❌ $($secret.path)" -ForegroundColor Red
        $failed++
    }
}

Write-Host ""
Write-Host "════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🎉 VAULT CONFIGURADO COM SUCESSO!" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Estatísticas:" -ForegroundColor Yellow
Write-Host "   ✅ Secrets criados: $created" -ForegroundColor Green
Write-Host "   ❌ Erros: $failed" -ForegroundColor Red
Write-Host ""
Write-Host "🔒 Backends protegidos:" -ForegroundColor Yellow
Write-Host "   • Delta Navigator (Backend SQL)" -ForegroundColor White
Write-Host "   • Backend PostgreSQL" -ForegroundColor White
Write-Host "   • Extrato Server" -ForegroundColor White
Write-Host "   • Iugu Server" -ForegroundColor White
Write-Host "   • Contratos Server" -ForegroundColor White
Write-Host "   • SQL Server (Legacy)" -ForegroundColor White
Write-Host ""
