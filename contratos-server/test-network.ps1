# Script para testar conectividade de rede do contratos-server

Write-Host "=== Teste de Conectividade - Contratos Server ===" -ForegroundColor Green

# Testar se a porta está aberta localmente
Write-Host "`n1. Testando porta 3004 localmente..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3004/health" -TimeoutSec 5
    Write-Host "✅ Localhost OK: $($response.status)" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro no localhost: $($_.Exception.Message)" -ForegroundColor Red
}

# Obter IP local
$localIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.PrefixOrigin -eq 'Dhcp'}).IPAddress | Select-Object -First 1

if ($localIP) {
    Write-Host "`n2. Testando IP da rede: $localIP" -ForegroundColor Yellow
    try {
        $response = Invoke-RestMethod -Uri "http://$localIP:3004/health" -TimeoutSec 5
        Write-Host "✅ IP da rede OK: $($response.status)" -ForegroundColor Green
    } catch {
        Write-Host "❌ Erro no IP da rede: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "💡 Possível problema de firewall ou binding" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Não foi possível obter IP da rede" -ForegroundColor Red
}

# Verificar regras de firewall
Write-Host "`n3. Verificando firewall do Windows..." -ForegroundColor Yellow
try {
    $firewallRules = Get-NetFirewallRule -DisplayName "*3004*" -ErrorAction SilentlyContinue
    if ($firewallRules) {
        Write-Host "✅ Regras de firewall encontradas para porta 3004" -ForegroundColor Green
        $firewallRules | ForEach-Object { Write-Host "   - $($_.DisplayName): $($_.Enabled)" }
    } else {
        Write-Host "⚠️  Nenhuma regra de firewall específica para porta 3004" -ForegroundColor Yellow
        Write-Host "💡 Considere criar uma regra para permitir conexões na porta 3004" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Erro ao verificar firewall: $($_.Exception.Message)" -ForegroundColor Red
}

# Verificar se há processos escutando na porta
Write-Host "`n4. Verificando processos na porta 3004..." -ForegroundColor Yellow
try {
    $netstat = netstat -an | Select-String ":3004"
    if ($netstat) {
        Write-Host "✅ Processo encontrado escutando na porta 3004:" -ForegroundColor Green
        $netstat | ForEach-Object { Write-Host "   - $_" }
    } else {
        Write-Host "❌ Nenhum processo escutando na porta 3004" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Erro ao verificar processos: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Comandos úteis ===" -ForegroundColor Cyan
Write-Host "Para criar regra de firewall:" -ForegroundColor White
Write-Host "New-NetFirewallRule -DisplayName 'Contratos Server 3004' -Direction Inbound -Protocol TCP -LocalPort 3004 -Action Allow" -ForegroundColor Gray

Write-Host "`nPara testar de outro PC:" -ForegroundColor White
Write-Host "curl http://$localIP:3004/api/test-connection" -ForegroundColor Gray