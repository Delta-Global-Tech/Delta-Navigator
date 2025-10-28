# Script para configurar firewall - EXECUTE COMO ADMINISTRADOR

Write-Host "=== Configuração de Firewall - Contratos Server ===" -ForegroundColor Green

# Verificar se está executando como administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

if (-not $isAdmin) {
    Write-Host "❌ ERRO: Este script precisa ser executado como Administrador!" -ForegroundColor Red
    Write-Host "💡 Clique com botão direito no PowerShell e selecione 'Executar como administrador'" -ForegroundColor Yellow
    Read-Host "Pressione Enter para sair"
    exit 1
}

Write-Host "✅ Executando como Administrador" -ForegroundColor Green

# Criar regra para entrada (Inbound)
try {
    Write-Host "`nCriando regra de entrada para porta 3004..." -ForegroundColor Yellow
    New-NetFirewallRule -DisplayName 'Contratos Server 3004 - Entrada' -Direction Inbound -Protocol TCP -LocalPort 3004 -Action Allow -Profile Any
    Write-Host "✅ Regra de entrada criada com sucesso!" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro ao criar regra de entrada: $($_.Exception.Message)" -ForegroundColor Red
}

# Criar regra para saída (Outbound) 
try {
    Write-Host "`nCriando regra de saída para porta 3004..." -ForegroundColor Yellow
    New-NetFirewallRule -DisplayName 'Contratos Server 3004 - Saída' -Direction Outbound -Protocol TCP -LocalPort 3004 -Action Allow -Profile Any
    Write-Host "✅ Regra de saída criada com sucesso!" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro ao criar regra de saída: $($_.Exception.Message)" -ForegroundColor Red
}

# Verificar se as regras foram criadas
Write-Host "`nVerificando regras criadas..." -ForegroundColor Yellow
$rules = Get-NetFirewallRule -DisplayName "*Contratos Server 3004*"
if ($rules) {
    Write-Host "✅ Regras encontradas:" -ForegroundColor Green
    $rules | ForEach-Object { 
        Write-Host "   - $($_.DisplayName): $($_.Enabled) ($($_.Direction))" -ForegroundColor Cyan
    }
} else {
    Write-Host "❌ Nenhuma regra encontrada" -ForegroundColor Red
}

Write-Host "`n=== Próximos passos ===" -ForegroundColor Green
Write-Host "1. Reinicie o servidor Node.js (contratos-server)" -ForegroundColor White
Write-Host "2. Teste a conexão de outro PC usando:" -ForegroundColor White
Write-Host "   curl http://SEU_IP:3004/api/test-connection" -ForegroundColor Gray
Write-Host "3. Se ainda não funcionar, verifique se o antivírus não está bloqueando" -ForegroundColor White

Read-Host "`nPressione Enter para continuar"