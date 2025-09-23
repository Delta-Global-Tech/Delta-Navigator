# Script para testar conectividade das APIs no Windows
Write-Host "=== Testando conectividade das APIs ===" -ForegroundColor Yellow
Write-Host ""

# Obter IP da máquina atual
$currentIP = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Ethernet*" | Where-Object {$_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*" -or $_.IPAddress -like "172.*"})[0].IPAddress
if (-not $currentIP) {
    $currentIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -ne "127.0.0.1"})[0].IPAddress
}

Write-Host "IP atual da máquina: $currentIP" -ForegroundColor Green
Write-Host ""

# Definir portas e nomes das APIs
$apis = @(
    @{Port = "3001"; Name = "SQL Server"},
    @{Port = "3002"; Name = "PostgreSQL"}, 
    @{Port = "3003"; Name = "Extrato"}
)

foreach ($api in $apis) {
    $port = $api.Port
    $name = $api.Name
    
    Write-Host "Testando $name (porta $port):" -ForegroundColor Cyan
    
    # Testar localhost
    Write-Host "  localhost:$port -> " -NoNewline
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$port/health" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
        Write-Host "✅ OK" -ForegroundColor Green
    } catch {
        Write-Host "❌ FALHOU" -ForegroundColor Red
    }
    
    # Testar IP da rede
    Write-Host "  $currentIP`:$port -> " -NoNewline
    try {
        $response = Invoke-WebRequest -Uri "http://$currentIP`:$port/health" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
        Write-Host "✅ OK" -ForegroundColor Green
    } catch {
        Write-Host "❌ FALHOU" -ForegroundColor Red
    }
    
    Write-Host ""
}

Write-Host "=== Fim do teste ===" -ForegroundColor Yellow
Write-Host ""
Write-Host "Se alguma API falhou no teste de rede, verifique:" -ForegroundColor Yellow
Write-Host "1. Se o serviço está rodando" -ForegroundColor White
Write-Host "2. Se a porta está aberta no firewall" -ForegroundColor White
Write-Host "3. Se o serviço está configurado para aceitar conexões externas" -ForegroundColor White