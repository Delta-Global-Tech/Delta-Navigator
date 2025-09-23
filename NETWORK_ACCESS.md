# Configuração para Acesso via Rede - ATUALIZADO

## Problema Identificado e Resolvido

**Situação:** Apenas a página de **Propostas** funcionava quando acessada de outros PCs via rede, porque ela usava `window.location.hostname` diretamente, enquanto as outras páginas usavam APIs configuradas incorretamente.

## Solução Implementada

### 1. Sistema de Configuração Unificado (`src/lib/api-config.ts`)

✅ **Criado sistema inteligente que:**
- Detecta automaticamente o hostname atual quando executado no browser
- Substitui `localhost` pelo IP da rede quando necessário
- Mantém compatibilidade com variáveis de ambiente
- Adiciona logging detalhado para debug
- Funciona tanto localmente quanto via rede

### 2. Arquivos Corrigidos

**Páginas atualizadas:**
- ✅ `ProducaoAnalyticsSimple.tsx` - Migrado para URLs dinâmicas
- ✅ `Propostas.tsx` - Migrado do hardcode para sistema unificado
- ✅ `Statement.tsx` - Já funcionava via variáveis de ambiente
- ✅ `Dashboard.tsx` - Usa Supabase (não afetado)
- ✅ `Funil.tsx` - Já funcionava via APIs dinâmicas
- ✅ `Faturas.tsx` - Já funcionava via APIs dinâmicas

**APIs atualizadas:**
- ✅ `src/data/postgres.ts` - URLs dinâmicas implementadas
- ✅ `src/data/sqlserver.ts` - URLs dinâmicas implementadas
- ✅ `src/data/statementApi.ts` - URLs dinâmicas implementadas
- ✅ `src/data/faturasApi.ts` - URLs dinâmicas implementadas

### 3. Teste de Conectividade

✅ **Página de Teste Criada:** `/network-test`
- Mostra informações do cliente atual
- Exibe URLs das APIs configuradas
- Permite testar conectividade de cada endpoint
- Mostra variáveis de ambiente ativas

## Como Testar

### 1. Verificar Conectividade
```bash
# Windows PowerShell
.\test-apis.ps1

# Bash/Linux
./test-apis.sh
```

### 2. Acessar Página de Teste
```
http://[SEU-IP]:3000/network-test
```

### 3. Verificar Logs no Console
Abra DevTools → Console e veja:
```
[API-CONFIG] Current hostname: 192.168.8.149, Port: 3001
[API-CONFIG] URLs geradas: {SQLSERVER: "http://192.168.8.149:3001", ...}
[REQUEST] 14:30:15 - Host: 192.168.8.149 - API: http://192.168.8.149:3001/api/...
```

## Como Funciona

### Detecção Automática
```typescript
// Sistema detecta automaticamente o contexto
if (typeof window !== 'undefined') {
  const currentHostname = window.location.hostname;
  return `http://${currentHostname}:${port}`;
}
```

### Cenários Suportados

**Local:**
```
Acesso: http://localhost:3000
APIs: http://localhost:3001, 3002, 3003
```

**Rede:**
```
Acesso: http://192.168.8.149:3000
APIs: http://192.168.8.149:3001, 3002, 3003
```

**Produção:**
```
Acesso: https://app.seudominio.com
APIs: https://api.seudominio.com
```

## Configuração das APIs Backend

**Importante:** As APIs backend devem estar configuradas para aceitar conexões externas:

### 1. Verificar se APIs estão rodando:
```bash
netstat -an | findstr ":300"
```

### 2. Configurar CORS nos backends:
```javascript
// Exemplo para Node.js/Express
app.use(cors({
  origin: ['http://localhost:3000', 'http://192.168.*:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### 3. Configurar bind address:
```javascript
// Escutar em todas as interfaces, não só localhost
app.listen(3001, '0.0.0.0', () => {
  console.log('Server running on all interfaces:3001');
});
```

## Verificação Final

✅ **Teste Completo:**
1. APIs rodando e acessíveis via rede ✅
2. Frontend detecta hostname automaticamente ✅
3. URLs construídas dinamicamente ✅
4. Logs de debug funcionando ✅
5. Página de teste disponível ✅

## Comandos Úteis

```bash
# Verificar IP da máquina
ipconfig | findstr IPv4

# Testar API específica via rede
curl "http://[SEU-IP]:3001/api/producao/status-analysis?startDate=2025-01-01&endDate=2025-09-22"

# Verificar portas abertas
netstat -an | findstr ":300"
```

## Resultado

🎯 **TODAS as páginas agora funcionam via rede!**
🔧 **Sistema unificado de configuração**
📊 **Logs detalhados para troubleshooting**
🧪 **Página de teste para validação**