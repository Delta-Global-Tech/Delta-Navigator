# Script para inicializar Vault com secrets da aplicacao (Windows)
# Executar apos: docker-compose up -d vault

$VAULT_ADDR = "http://localhost:8200"
$VAULT_TOKEN = "devtoken"

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Inicializando HashiCorp Vault" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Aguardar Vault estar pronto
Write-Host "[1/5] Aguardando Vault estar pronto..." -ForegroundColor Yellow
for ($i = 1; $i -le 30; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "$VAULT_ADDR/v1/sys/health" -UseBasicParsing -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 473) {
            Write-Host "[OK] Vault respondendo" -ForegroundColor Green
            break
        }
    } catch {
        Write-Host "   Tentativa $i/30..." -ForegroundColor Gray
        Start-Sleep -Seconds 1
    }
}

Write-Host ""
Write-Host "[2/5] Verificando autenticacao..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$VAULT_ADDR/v1/auth/token/lookup-self" `
        -Headers @{"X-Vault-Token" = $VAULT_TOKEN} `
        -UseBasicParsing -ErrorAction SilentlyContinue
    Write-Host "[OK] Token valido" -ForegroundColor Green
} catch {
    Write-Host "[ERRO] Token invalido: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[3/5] Adicionando secrets..." -ForegroundColor Yellow

# Function para adicionar secret
function Add-VaultSecret {
    param(
        [string]$Path,
        [string]$Value,
        [string]$DisplayName
    )
    
    $body = @{
        data = @{
            data = @{
                value = $Value
            }
        }
    } | ConvertTo-Json
    
    try {
        $response = Invoke-WebRequest -Uri "$VAULT_ADDR/v1/$Path" `
            -Method POST `
            -Headers @{"X-Vault-Token" = $VAULT_TOKEN} `
            -Body $body `
            -ContentType "application/json" `
            -UseBasicParsing -ErrorAction SilentlyContinue
        Write-Host "   [OK] $DisplayName" -ForegroundColor Green
    } catch {
        Write-Host "   [ERRO] $DisplayName - $_" -ForegroundColor Red
    }
}

# Adicionar secrets
Add-VaultSecret "secret/data/delta/postgres-password" "MinhaSenh@123" "postgres-password"
Add-VaultSecret "secret/data/delta/postgres-host" "192.168.8.149" "postgres-host"
Add-VaultSecret "secret/data/delta/postgres-port" "5432" "postgres-port"
Add-VaultSecret "secret/data/delta/postgres-db" "airflow_treynor" "postgres-db"
Add-VaultSecret "secret/data/delta/postgres-user" "postgres" "postgres-user"

# JWT Secret (aleatorio)
$JWT_SECRET = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((New-Guid).ToString()))
Add-VaultSecret "secret/data/delta/jwt-secret" $JWT_SECRET "jwt-secret (aleatorio)"

Write-Host ""
Write-Host "[4/5] Verificando secrets armazenados..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$VAULT_ADDR/v1/secret/data/delta/postgres-password" `
        -Headers @{"X-Vault-Token" = $VAULT_TOKEN} `
        -UseBasicParsing -ErrorAction SilentlyContinue
    Write-Host "   [OK] Secrets acessiveis" -ForegroundColor Green
} catch {
    Write-Host "   [ERRO] Nao conseguiu acessar secrets" -ForegroundColor Red
}

Write-Host ""
Write-Host "[5/5] Exibindo informacoes de acesso..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Acesso ao Vault:" -ForegroundColor Cyan
Write-Host "   URL:   $VAULT_ADDR" -ForegroundColor Cyan
Write-Host "   Token: $VAULT_TOKEN" -ForegroundColor Cyan
Write-Host "   UI:    http://localhost:8200/ui" -ForegroundColor Cyan
Write-Host ""
Write-Host "Secrets armazenados em:" -ForegroundColor Cyan
Write-Host "   secret/data/delta/postgres-password" -ForegroundColor Gray
Write-Host "   secret/data/delta/postgres-host" -ForegroundColor Gray
Write-Host "   secret/data/delta/postgres-port" -ForegroundColor Gray
Write-Host "   secret/data/delta/postgres-db" -ForegroundColor Gray
Write-Host "   secret/data/delta/postgres-user" -ForegroundColor Gray
Write-Host "   secret/data/delta/jwt-secret" -ForegroundColor Gray
Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Vault inicializado com sucesso!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Proximos passos:" -ForegroundColor Cyan
Write-Host "   1. Testar acesso: curl http://localhost:8200/v1/sys/health" -ForegroundColor Yellow
Write-Host "   2. Modificar backends para usar Vault" -ForegroundColor Yellow
Write-Host "   3. Validar fallback para .env" -ForegroundColor Yellow
Write-Host ""
