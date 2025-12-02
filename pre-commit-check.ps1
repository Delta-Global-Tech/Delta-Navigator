# pre-commit hook para Windows PowerShell
# Detecta credenciais antes de commitar

param(
    [switch]$Force
)

Write-Host "🔍 Executando verificação de segurança..." -ForegroundColor Cyan

$patterns = @(
    'password\s*[=:]\s*[''"]?[^''"\\s]',
    'secret\s*[=:]\s*[''"]?[^''"\\s]',
    'api_key\s*[=:]\s*[''"]?[^''"\\s]',
    'token\s*[=:]\s*[''"]?[^''"\\s]',
    'credential\s*[=:]\s*[''"]?[^''"\\s]',
    'POSTGRES_PASSWORD\s*[=:]\s*[^#\\s]',
    'DB_PASSWORD\s*[=:]\s*[^#\\s]',
    'AWS_SECRET',
    'PRIVATE_KEY'
)

$protectedFiles = @(
    ".env",
    ".env.local",
    ".env.*.local",
    "*.pem",
    "*.key",
    "secrets/"
)

# Verificar se arquivos protegidos foram staged
$stagedFiles = git diff --cached --name-only 2>$null
foreach ($file in $protectedFiles) {
    if ($stagedFiles -match [regex]::Escape($file)) {
        Write-Host "❌ ERRO: Arquivo protegido '$file' foi staged!" -ForegroundColor Red
        Write-Host "   Remova com: git reset HEAD $file" -ForegroundColor Yellow
        exit 1
    }
}

# Verificar conteúdo
$diff = git diff --cached -p 2>$null
$suspiciousPatternFound = $false

foreach ($pattern in $patterns) {
    if ($diff -match $pattern) {
        if (-not $suspiciousPatternFound) {
            Write-Host "⚠️  Padrões suspeitos detectados:" -ForegroundColor Yellow
            $suspiciousPatternFound = $true
        }
        Write-Host "   📌 Pattern: $pattern" -ForegroundColor Yellow
        $diff -match $pattern | Select-Object -First 3 | ForEach-Object { Write-Host "      $_" }
    }
}

if ($suspiciousPatternFound -and -not $Force) {
    Write-Host ""
    Write-Host "❓ Você tem certeza de que quer commitar isso?" -ForegroundColor Yellow
    $response = Read-Host "(y/n)"
    
    if ($response -ne "y") {
        Write-Host "❌ Commit cancelado" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ Verificação passou!" -ForegroundColor Green
exit 0
