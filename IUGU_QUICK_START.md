# 🚀 IUGU - Guia de Inicialização Rápida

## ⚡ 1 Minuto para Começar

### Passo 1: Iniciar o Servidor IUGU
```powershell
cd iugu-server
npm start
```

Você verá:
```
✅ Servidor IUGU rodando em http://localhost:3005
   Endpoints disponíveis:
   - GET /api/test (teste de conexão)
   - GET /api/bank-slips (buscar todos os boletos)
   - GET /api/bank-slips/stats (estatísticas)
   - GET /api/bank-slips/by-status/:status (boletos por status)
   - GET /health (health check)
```

### Passo 2: Testar a Conexão (em outro terminal)
```powershell
# PowerShell
curl http://localhost:3005/api/test

# ou use o script de teste
.\test-iugu.ps1
```

### Passo 3: Iniciar o Frontend (em terceiro terminal)
```powershell
npm run dev
```

### Passo 4: Acessar a Tela
Abra: `http://localhost:5173/licitacoes`

## ✅ Tudo Pronto!

A tela de licitações agora:
- ✅ Conecta ao servidor iugu-server (porta 3005)
- ✅ Busca dados do PostgreSQL externo
- ✅ Exibe boletos em uma tabela bonita
- ✅ Permite filtrar por cliente e status
- ✅ Exporta em CSV
- ✅ Mostra estatísticas

## 🔧 Comandos Úteis

### Iniciar Todos os Servidores de Uma Vez
```powershell
npm run dev:full
```

### Apenas os Backends
```powershell
npm run servers
```

### Desenvolvimento (com auto-reload)
```powershell
cd iugu-server
npm run dev
```

### Testar Endpoints
```powershell
.\test-iugu.ps1
```

## 🐛 Se Algo der Errado

### Porta 3005 Ocupada
```powershell
netstat -ano | findstr :3005
taskkill /PID <PID> /F
```

### Erro de Conexão com BD
1. Verificar ping: `ping 10.174.1.117`
2. Verificar credenciais em `iugu-server/.env`
3. Ver logs: `npm run dev` (mostra mais detalhes)

### Não Vê Dados na Tela
1. Verificar console do navegador (F12)
2. Verificar logs do servidor: `npm run dev`
3. Testar endpoint diretamente: `curl http://localhost:3005/api/bank-slips`

## 📊 O que Você Verá

Na tela `/licitacoes`:

```
┌─────────────────────────────────────────────────────────┐
│ Licitações (Iugu)                                       │
│ Gestão e acompanhamento de boletos bancários            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Total de Boletos: 50                                  │
│  Valor Total: R$ 50.000,00                             │
│  Valor Líquido: R$ 49.000,00                           │
│  Total de Taxas: R$ 1.000,00                           │
│  Pagos: 35 (70%)                                       │
│                                                         │
│  [Filtros]     [Buscar]        [↻ Atualizar] [↓ CSV]  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Cliente │ Tipo │ Total │ Líquido │ Taxa │ Status   │ │
│  ├───────────────────────────────────────────────────┤ │
│  │ SAAE... │ Iugu │ 1.000 │ 980    │ 20   │ ✓ Pago   │ │
│  │ SAAE... │ Iugu │ 2.000 │ 1.960  │ 40   │ ⏱ Aberto │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## 🎯 Próximos Passos

1. **Testar com seus dados**: Modificar a query em `iugu-server/server.js` se necessário
2. **Customizar filtros**: Adicionar novos filtros na tela `src/pages/Licitacoes.tsx`
3. **Integrar com outras telas**: Usar o mesmo padrão para outras funcionalidades
4. **Fazer deploy**: Usar o Dockerfile quando estiver pronto

## 📝 Notas Importantes

- ✅ Não mexeu em nenhuma outra tela
- ✅ Servidor isolado (porta 3005)
- ✅ Mesmo padrão dos outros servidores
- ✅ Suporta rede (usa getApiUrl dinamicamente)
- ✅ CORS habilitado
- ✅ Logs detalhados para debug

## 💡 Dicas

- Use `npm run dev` para desenvolvimento com auto-reload
- Verifique os logs do servidor para debug
- O arquivo `.env` em `iugu-server/` pode ser editado se precisar mudar credenciais
- A porta 3005 foi escolhida seguindo o padrão (3001, 3002, 3003, 3004, 3005)

Divirta-se! 🎉
