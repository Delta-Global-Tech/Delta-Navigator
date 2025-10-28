# 🚀 Licitações (Iugu) - Guia Rápido de Teste

## ✅ O Que Foi Implementado

### 1️⃣ Frontend
- ✨ Nova página: `src/pages/Licitacoes.tsx` (350+ linhas)
- 📍 Rota: `/licitacoes`
- 🎨 Interface completa com estatísticas, filtros e tabela interativa
- 📥 Exportação para CSV
- 🔄 Atualização em tempo real

### 2️⃣ Sidebar
- ✅ Novo item adicionado: **"Licitações (Iugu)"**
- 📍 Local: Backoffice Delta → Licitações (Iugu)
- 🎯 Ícone: FileCheck (com badge "📋 Novo")

### 3️⃣ Backend - PostgreSQL
- 🔌 **Endpoint 1**: `GET /api/licitacoes/bank-slips`
  - Retorna lista de boletos bancários
  - Conecta ao banco: `ntxdeltaglobal`
  - Cliente: `SAAE - Client Production`

- 📊 **Endpoint 2**: `GET /api/licitacoes/bank-slips/stats`
  - Retorna estatísticas agregadas
  - Contagem por status
  - Somas totais

---

## 🧪 PASSOS PARA TESTAR

### Passo 1: Iniciar os Servidores

Abra **3 terminais PowerShell**:

#### Terminal 1: Frontend Vite
```powershell
cd c:\Users\alexsandro.costa\Delta-Navigator
npm run dev
```
**Esperado**: Aplicação rodando em `http://localhost:5173` ou outra porta

#### Terminal 2: PostgreSQL Server
```powershell
cd c:\Users\alexsandro.costa\Delta-Navigator
npm run server:postgres
```
**Esperado**: Servidor rodando na porta 3002

#### Terminal 3: PIX Gateway (opcional, para não ter erro)
```powershell
cd c:\Users\alexsandro.costa\Delta-Navigator
npm run server:pix
```
**Esperado**: Servidor rodando na porta 3004

---

### Passo 2: Testar Endpoints via PowerShell

Em um **novo terminal**, execute os testes:

```powershell
# Teste de conectividade básica
curl http://localhost:3002/api/test | ConvertFrom-Json

# Resposta esperada:
# message : Conexão PostgreSQL bem-sucedida!
# time    : 2025-10-21T...
```

```powershell
# Buscar boletos bancários
$response = Invoke-WebRequest -Uri "http://localhost:3002/api/licitacoes/bank-slips" -Method Get
$response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10

# Resposta esperada:
# {
#   "data": [
#     {
#       "client_name": "SAAE - Client Production",
#       "processor_type": "IUGU",
#       "amount": 1000.00,
#       "paid_net_amount": 950.00,
#       "fee_amount": 50.00,
#       "status": "paid",
#       "paid_at": "2025-10-21T10:30:00Z"
#     }
#   ],
#   "count": 42
# }
```

```powershell
# Buscar estatísticas
curl http://localhost:3002/api/licitacoes/bank-slips/stats | ConvertFrom-Json

# Resposta esperada:
# total_count  : 42
# paid_count   : 28
# open_count   : 10
# canceled_count : 4
# total_amount : 42000.00
# ...
```

---

### Passo 3: Testar no Frontend

1. **Abrir Navegador**
   - URL: `http://localhost:5173`
   - Fazer login (se necessário)

2. **Navegar até Licitações**
   - Clique no menu **Backoffice Delta** (lado esquerdo)
   - Expanda e clique em **"Licitações (Iugu)"**

3. **Verificar Componentes**
   - ✅ Estatísticas aparecem (Total, Valor, Taxas, etc)
   - ✅ Tabela com dados carrega
   - ✅ Filtros funcionam (busca e status)
   - ✅ Botões funcionam (Atualizar, Exportar CSV)

4. **Testar Funcionalidades**
   - Digite na busca → Tabela filtra em tempo real
   - Mude o filtro de status → Resultados atualizam
   - Clique "Atualizar" → Dados recarregam
   - Clique "Exportar CSV" → Arquivo baixa

---

## 📊 Dados de Teste

A query busca dados de:

```
Banco: ntxdeltaglobal
Host: 10.174.1.117
Tabelas: client_api_keys, processors, bank_slips
Filtro: client_name = 'SAAE - Client Production'
```

Se não houver dados, a página mostrará mensagem vazia.

---

## 🔍 Troubleshooting

### Erro: "Servidor não está acessível"
```powershell
# Verificar se o servidor PostgreSQL está rodando
npm run server:postgres

# Verificar se porta 3002 está em uso
netstat -ano | findstr :3002
```

### Erro: "Erro ao carregar licitações"
```powershell
# Verificar conexão com banco de dados
curl http://localhost:3002/api/test

# Testar conectividade direta:
# telnet 10.174.1.117 5432
```

### Dados não aparecem na tabela
```
- Verificar se há registros no banco para cliente 'SAAE - Client Production'
- Executar query manualmente no banco
- Verificar logs do servidor: npm run server:postgres
```

### Página não carrega
```
- Verificar console do navegador (F12)
- Verificar se rota foi adicionada em App.tsx ✅
- Verificar se componente Licitacoes.tsx existe ✅
- Limpar cache: Ctrl+Shift+Delete
```

---

## 📋 Checklist de Validação

- [ ] Sidebar mostra nova aba "Licitações (Iugu)"
- [ ] Clicar na aba leva para `/licitacoes`
- [ ] Página carrega sem erros
- [ ] Estatísticas aparecem (se houver dados)
- [ ] Tabela exibe boletos
- [ ] Filtro de busca funciona
- [ ] Filtro de status funciona
- [ ] Botão "Atualizar" recarrega dados
- [ ] Botão "Exportar CSV" baixa arquivo
- [ ] Formatação de moeda está correta (R$)
- [ ] Status aparecem com cores corretas
- [ ] Responsividade funciona em mobile
- [ ] Mensagens de erro aparecem se necessário
- [ ] Sem erros de JavaScript no console

---

## 📞 Suporte

### Logs Úteis

#### No Terminal do Frontend:
```
Procurar por: [400], [500], erro de parsing JSON
```

#### No Terminal do PostgreSQL:
```
Procurar por: 📋 Buscando, ✅ Encontrados, ❌ Erro
```

#### No Console do Navegador (F12):
```
Abrir Developer Tools → Console → Procurar erros vermelhos
```

---

## 🎉 Sucesso!

Se tudo funcionar, você verá:

1. ✅ Menu "Licitações (Iugu)" no sidebar
2. ✅ Estatísticas de boletos
3. ✅ Tabela com dados do banco
4. ✅ Filtros funcionando
5. ✅ Exportação de CSV

**Parabéns! Licitações (Iugu) está implementada com sucesso! 🚀**
