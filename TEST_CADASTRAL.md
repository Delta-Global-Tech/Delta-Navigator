# 🧪 Guia de Testes - Cadastral

## ✅ Checklist de Testes Manuais

### 1. Backend - API endpoints

#### Teste 1.1: Listar clientes sem filtro
```bash
curl "http://localhost:3003/api/cadastral/clientes"
```
**Esperado**: Array de clientes com todos os campos

#### Teste 1.2: Buscar cliente por nome
```bash
curl "http://localhost:3003/api/cadastral/clientes?search=João"
```
**Esperado**: Array filtrado com nomes que contenham "João"

#### Teste 1.3: Filtrar por estado
```bash
curl "http://localhost:3003/api/cadastral/clientes?estado=SP"
```
**Esperado**: Apenas clientes do estado SP

#### Teste 1.4: Mapa de cidades
```bash
curl "http://localhost:3003/api/cadastral/mapa-cidades"
```
**Esperado**: Array com cidades, quantidade de clientes e crédito

#### Teste 1.5: Mapa filtrado por estado
```bash
curl "http://localhost:3003/api/cadastral/mapa-cidades?estado=RJ"
```
**Esperado**: Cidades apenas do RJ

#### Teste 1.6: Estatísticas gerais
```bash
curl "http://localhost:3003/api/cadastral/estatisticas"
```
**Esperado**: Totais agregados de clientes, crédito, etc.

### 2. Frontend - Funcionalidades

#### Teste 2.1: Navegação para Cadastral
- [ ] Abra a aplicação
- [ ] Clique no menu "Delta Global Bank"
- [ ] Clique em "Cadastral"
- [ ] Esperado: Página carrega com KPIs

#### Teste 2.2: KPIs Carregam Corretamente
- [ ] Verificar se 5 cards aparecem
- [ ] Total de clientes > 0
- [ ] Crédito total > 0
- [ ] Total de estados > 0

#### Teste 2.3: Aba Mapa de Cidades
- [ ] Clique em "Mapa de Cidades"
- [ ] Verificar cards de cidades
- [ ] Selecione um estado (ex: SP)
- [ ] Esperado: Apenas cidades do SP aparecem
- [ ] Clique "Todos os Estados"
- [ ] Esperado: Todas as cidades reaparecem

#### Teste 2.4: Aba Clientes
- [ ] Clique em "Clientes"
- [ ] Tabela deve aparecer
- [ ] Scrolbar deve funcionar
- [ ] Verificar colunas: Nome, CPF/CNPJ, Email, Conta, Status, Crédito, Localização

#### Teste 2.5: Busca de Clientes
- [ ] Na aba "Clientes", escreva um nome na busca
- [ ] Aguarde 500ms (debounce)
- [ ] Esperado: Tabela se filtra
- [ ] Busque por CPF
- [ ] Esperado: Filtra corretamente
- [ ] Busque por email
- [ ] Esperado: Filtra corretamente

#### Teste 2.6: Filtro por Estado
- [ ] Na aba "Clientes", clique em um estado
- [ ] Esperado: Tabela se filtra para esse estado

#### Teste 2.7: Responsividade
- [ ] Redimensione o navegador para mobile
- [ ] Grid deve se adaptar
- [ ] Tabela deve rolar horizontalmente em mobile

### 3. Performance

#### Teste 3.1: Cache
- [ ] Acesse a página
- [ ] Observe os tempos de resposta
- [ ] Atualize a página
- [ ] Esperado: Segunda vez é mais rápida (cache hit)

#### Teste 3.2: Debounce de Busca
- [ ] Digite na busca rapidamente
- [ ] Observe que apenas 1 requisição é feita (não múltiplas)

### 4. Integração

#### Teste 4.1: Não quebrou Outras Páginas
- [ ] Extrato: Funciona?
- [ ] Ranking: Funciona?
- [ ] Faturas: Funciona?
- [ ] Dashboard: Funciona?

#### Teste 4.2: Menu Aparece
- [ ] Sidebar mostra "Cadastral" em Delta Global Bank
- [ ] Badge "✨ Novo" aparece

## 🔧 Script PowerShell para Teste Automático

```powershell
# Salve como test-cadastral.ps1

$baseUrl = "http://localhost:3003/api/cadastral"

Write-Host "🧪 Iniciando testes da API Cadastral..." -ForegroundColor Cyan

# Teste 1: Clientes
Write-Host "`n📋 Teste 1: Listar clientes..." -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/clientes?limite=5" -Method Get
    Write-Host "✅ Sucesso! Total: $($response.total)" -ForegroundColor Green
    $response.clientes | Select-Object -First 1 | ConvertTo-Json
} catch {
    Write-Host "❌ Erro: $_" -ForegroundColor Red
}

# Teste 2: Mapa Cidades
Write-Host "`n🗺️  Teste 2: Mapa de cidades..." -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/mapa-cidades" -Method Get
    Write-Host "✅ Sucesso! Total cidades: $($response.total_cidades)" -ForegroundColor Green
    $response.dados | Select-Object -First 3 | ConvertTo-Json
} catch {
    Write-Host "❌ Erro: $_" -ForegroundColor Red
}

# Teste 3: Estatísticas
Write-Host "`n📊 Teste 3: Estatísticas..." -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/estatisticas" -Method Get
    Write-Host "✅ Sucesso!" -ForegroundColor Green
    Write-Host "Total de clientes: $($response.total_clientes)"
    Write-Host "Clientes ativos: $($response.clientes_ativos)"
    Write-Host "Crédito total: R$ $($response.total_credito_liberado | [Math]::Round)"
} catch {
    Write-Host "❌ Erro: $_" -ForegroundColor Red
}

# Teste 4: Filtro por estado
Write-Host "`n🔍 Teste 4: Filtrar SP..." -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/clientes?estado=SP&limite=5" -Method Get
    Write-Host "✅ Sucesso! Clientes SP: $($response.total)" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro: $_" -ForegroundColor Red
}

Write-Host "`n✅ Testes finalizados!" -ForegroundColor Cyan
```

Execute com:
```powershell
. .\test-cadastral.ps1
```

## 📝 Resultados de Teste

### Seu ambiente

- [ ] Backend rodando na porta 3003
- [ ] Frontend rodando na porta 3000
- [ ] Banco de dados respondendo
- [ ] Cache funcionando (30s TTL)

### Dados esperados

- [ ] Mínimo 100 clientes cadastrados
- [ ] Mínimo 5 estados representados
- [ ] Mínimo 20 cidades diferentes
- [ ] Crédito total > 0

---

**Data do Teste**: ___________  
**Testador**: ___________  
**Resultado**: [ ] PASSOU [ ] FALHOU
