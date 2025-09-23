# Configuração para Acesso via Rede

## Problema Resolvido

Anteriormente, apenas a página de **Propostas** funcionava quando acessada de outros PCs via rede porque ela usava `window.location.hostname` para construir as URLs das APIs dinamicamente, enquanto as outras páginas usavam URLs hardcoded com `localhost`.

## Solução Implementada

### 1. Utilitário de Configuração Dinâmica (`src/lib/api-config.ts`)

Criamos um sistema inteligente que:
- ✅ Detecta automaticamente o hostname atual quando executado no browser
- ✅ Substitui `localhost` pelo IP da rede quando necessário
- ✅ Mantém compatibilidade com variáveis de ambiente
- ✅ Adiciona logging detalhado para debug

### 2. Arquivos Atualizados

**Páginas corrigidas:**
- ✅ `ProducaoAnalyticsSimple.tsx` - URLs dinâmicas implementadas
- ✅ `Statement.tsx` - Já funcionava via variáveis de ambiente
- ✅ `Dashboard.tsx` - Já funcionava via variáveis de ambiente  
- ✅ `Funil.tsx` - Já funcionava via variáveis de ambiente
- ✅ `Faturas.tsx` - Já funcionava via variáveis de ambiente
- ✅ `Propostas.tsx` - Já funcionava (era o único correto)

**APIs atualizadas:**
- ✅ `src/data/postgres.ts` - URLs dinâmicas
- ✅ `src/data/sqlserver.ts` - URLs dinâmicas  
- ✅ `src/data/statementApi.ts` - URLs dinâmicas
- ✅ `src/data/faturasApi.ts` - URLs dinâmicas

## Como Funciona

### Cenário 1: Acesso Local (localhost)
```
URL construída: http://localhost:3001/api/...
```

### Cenário 2: Acesso via Rede (ex: 192.168.1.100)
```
URL construída: http://192.168.1.100:3001/api/...
```

### Cenário 3: Servidor na Nuvem
```
URL construída: http://seu-servidor.com:3001/api/...
```

## Configuração para Diferentes Ambientes

### Desenvolvimento Local
```env
VITE_API_POSTGRES_URL=http://localhost:3002
VITE_API_SQLSERVER_URL=http://localhost:3001  
VITE_EXTRATO_API_URL=http://localhost:3003
```

### Acesso via Rede Local
```env
VITE_API_POSTGRES_URL=http://192.168.1.100:3002
VITE_API_SQLSERVER_URL=http://192.168.1.100:3001
VITE_EXTRATO_API_URL=http://192.168.1.100:3003
```

### Produção
```env
VITE_API_POSTGRES_URL=https://api.seudominio.com
VITE_API_SQLSERVER_URL=https://api2.seudominio.com
VITE_EXTRATO_API_URL=https://api3.seudominio.com
```

## Benefícios

1. **Auto-detecção**: Sistema detecta automaticamente o contexto de execução
2. **Flexibilidade**: Funciona em qualquer ambiente sem mudanças de código
3. **Debug**: Logs detalhados mostram hostname e URLs utilizadas
4. **Compatibilidade**: Mantém funcionamento com .env existente
5. **Rede**: Funciona perfeitamente quando acessado via IP da rede

## Logs de Debug

O sistema agora exibe logs no console mostrando:
```
[REQUEST] 14:30:15 - Host: 192.168.1.100 - API: http://192.168.1.100:3001/api/producao/status-analysis
[SUCCESS] 14:30:16 - Host: 192.168.1.100 - API: http://192.168.1.100:3001/api/producao/status-analysis
```

Isso facilita o debugging de problemas de conectividade.

## Testando

1. **Local**: Acesse `http://localhost:5173` - deve funcionar normalmente
2. **Rede**: Acesse `http://[IP-DA-MAQUINA]:5173` de outro PC - agora todas as páginas funcionam
3. **Debug**: Abra DevTools → Console para ver os logs das chamadas de API

## Resultado

✅ **Todas as páginas agora funcionam via rede**  
✅ **Sistema inteligente detecta ambiente automaticamente**  
✅ **Compatibilidade mantida com configurações existentes**  
✅ **Logs de debug implementados**