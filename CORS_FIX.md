# Correção CORS para Acesso via Rede

## Problema Identificado

As páginas de **Extrato**, **Faturas** e **Ranking** não funcionavam via rede porque o servidor `extrato-server` (porta 3003) estava configurado com CORS restrito apenas para `localhost:3000`.

## Correção Aplicada

### 1. CORS Configuração Atualizada

**Arquivo:** `extrato-server/server.js`

**ANTES:**
```javascript
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
```

**DEPOIS:**
```javascript
app.use(cors({ 
  origin: [
    'http://localhost:3000',
    /^http:\/\/192\.168\.\d+\.\d+:3000$/,
    /^http:\/\/10\.\d+\.\d+\.\d+:3000$/,
    /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+:3000$/
  ], 
  credentials: true 
}));
```

### 2. ExtratoRanking.tsx Atualizado

Migrado para usar o sistema de configuração dinâmica:
- ✅ Import de `getApiEndpoint` e `logApiCall`
- ✅ URLs construídas dinamicamente
- ✅ Logs de debug implementados

## Como Aplicar a Correção

### 1. Reiniciar o Extrato Server

```bash
# Parar o servidor atual (Ctrl+C no terminal onde está rodando)
# Depois reiniciar:
cd extrato-server
npm start
```

### 2. Verificar se a Correção Funcionou

```bash
# Testar CORS via rede
curl -H "Origin: http://192.168.8.149:3000" -v "http://192.168.8.149:3003/api/statement"
```

Verifique se a resposta contém:
```
Access-Control-Allow-Origin: http://192.168.8.149:3000
```

### 3. Testar as Páginas

Acesse via rede e teste:
- ✅ Extrato: `http://192.168.8.149:3000/extrato`
- ✅ Faturas: `http://192.168.8.149:3000/faturas` 
- ✅ Ranking: `http://192.168.8.149:3000/extrato-ranking`

## Status dos Servidores

| Servidor | Porta | CORS Status | Páginas Afetadas |
|----------|-------|-------------|------------------|
| SQL Server | 3001 | ✅ `*` (aceita qualquer origem) | Produção Analytics |
| PostgreSQL | 3002 | ✅ `cors()` (aceita qualquer origem) | Dashboard, Funil, Propostas |
| Extrato | 3003 | ✅ **CORRIGIDO** (aceita rede local) | Extrato, Faturas, Ranking |

## Padrões de IP Suportados

A nova configuração aceita:
- `localhost:3000` (desenvolvimento local)
- `192.168.x.x:3000` (rede local comum)
- `10.x.x.x:3000` (redes corporativas)
- `172.16-31.x.x:3000` (redes Docker/privadas)

## Verificação Final

Execute o script de teste:
```bash
./test-apis.ps1
```

Agora deve mostrar ✅ para todas as APIs quando testadas via rede.

## Troubleshooting

Se ainda não funcionar:
1. **Verificar se o servidor foi reiniciado** após a mudança
2. **Limpar cache do browser** (Ctrl+F5)
3. **Verificar firewall** se bloqueia a porta 3003
4. **Verificar logs do servidor** para erros CORS

## Logs para Monitorar

No browser (DevTools → Console):
```
[API-CONFIG] URLs geradas: {EXTRATO: "http://192.168.8.149:3003"}
[REQUEST] 14:30:15 - Host: 192.168.8.149 - API: http://192.168.8.149:3003/api/statement
[SUCCESS] 14:30:16 - Host: 192.168.8.149 - API: http://192.168.8.149:3003/api/statement
```

No servidor extrato-server:
```
[2025-09-23T14:30:15.123Z] GET /api/statement
```