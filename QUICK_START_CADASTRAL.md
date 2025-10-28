# 🚀 Quick Start - Cadastral

## Pré-requisitos

✅ Backend (extrato-server) rodando na porta 3003  
✅ Frontend rodando na porta 3000  
✅ Banco de dados PostgreSQL acessível

## ⚡ Iniciar Rápido

### 1. Iniciar servidores

```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend
npm run server:extrato

# Ou ambos juntos
npm run dev:full
```

### 2. Acessar a tela

- Abra seu navegador: `http://localhost:3000`
- Faça login
- Menu lateral > **Delta Global Bank** > **Cadastral** ✨

## 📸 O que você vai ver

### Tela 1: Indicadores Principais
```
Total de Clientes | Clientes Ativos | Crédito Total | Crédito Médio | Cobertura Geográfica
```

### Tela 2: Mapa de Cidades
```
[Todos os Estados] [SP] [RJ] [MG] [BA] ...

├─ São Paulo (SP)
│  ├─ Clientes: 8,500
│  ├─ Crédito: R$ 2.1B
│  └─ Médio: R$ 247k
│
├─ Rio de Janeiro (RJ)
│  ├─ Clientes: 3,200
│  ├─ Crédito: R$ 850M
│  └─ Médio: R$ 265k
│
└─ ...mais cidades
```

### Tela 3: Clientes
```
[Buscar por nome, CPF, email...]

Nome          | CPF/CNPJ    | Email              | Conta    | Status  | Crédito    | Local
──────────────┼─────────────┼────────────────────┼──────────┼─────────┼────────────┼──────────
João Silva    | 123.456...  | joao@email.com     | 001234   | Ativo   | R$ 50.000  | SP
Maria Santos  | 987.654...  | maria@email.com    | 001235   | Ativo   | R$ 75.000  | RJ
...
```

## 🔍 Filtros Disponíveis

### Mapa de Cidades
- **Filtro por Estado**: Clique em qualquer estado para filtrar
- **Visualização**: Gráficos de barras com distribuição

### Tabela de Clientes
- **Busca**: Nome, CPF/CNPJ ou Email (em tempo real)
- **Filtro por Estado**: Escolha um estado

## 🎯 Casos de Uso Comuns

### Caso 1: "Quantos clientes tenho em São Paulo?"
1. Abra a aba "Mapa de Cidades"
2. Clique em "SP"
3. Veja a quantidade exibida

### Caso 2: "Qual o crédito total liberado?"
1. Veja o KPI "Crédito Total Liberado" no topo
2. Valor em tempo real

### Caso 3: "Preciso encontrar um cliente específico"
1. Abra a aba "Clientes"
2. Digite o nome/CPF/email na busca
3. Encontre e visualize os dados

### Caso 4: "Qual é o crédito médio dos clientes?"
1. Veja o KPI "Crédito Médio" no topo
2. Ou calcule por cidade no "Mapa de Cidades"

## 🐛 Troubleshooting

### "API não responde"
```
❌ Verifique se extrato-server está rodando na porta 3003
✅ Execute: npm run server:extrato
```

### "Sem dados exibindo"
```
❌ Verifique se tem registros no banco:
   SELECT COUNT(*) FROM dim_account;
✅ Deve retornar > 0
```

### "Página carregando lentamente"
```
❌ Primeira vez é normal (sem cache)
✅ Segunda vez é instantânea (cache 30s)
```

### "Erro de autenticação"
```
❌ Faça login novamente
✅ Limpe cookies e tente
```

## 📊 API Endpoints (para testes)

### Clientes
```bash
curl "http://localhost:3003/api/cadastral/clientes"
curl "http://localhost:3003/api/cadastral/clientes?estado=SP"
curl "http://localhost:3003/api/cadastral/clientes?search=João"
```

### Mapa de Cidades
```bash
curl "http://localhost:3003/api/cadastral/mapa-cidades"
curl "http://localhost:3003/api/cadastral/mapa-cidades?estado=SP"
```

### Estatísticas
```bash
curl "http://localhost:3003/api/cadastral/estatisticas"
```

## 💾 Cache

O sistema cacheia por **30 segundos**:
- Dados de clientes
- Dados de mapa
- Estatísticas

Para forçar atualização: Atualize a página após 30s

## ⌨️ Atalhos

| Ação | Atalho |
|------|--------|
| Menu Cadastral | Sidebar > Delta Global Bank > Cadastral |
| Aba Mapa | Clique em "Mapa de Cidades" |
| Aba Clientes | Clique em "Clientes" |
| Buscar Cliente | Digite na caixa "Buscar..." |
| Filtrar Estado | Clique no estado desejado |

## 📱 Responsividade

✅ **Desktop**: Grid 3 colunas  
✅ **Tablet**: Grid 2 colunas  
✅ **Mobile**: Grid 1 coluna + scroll horizontal

## 🎓 Dicas

1. **Performance**: Use filtro por estado para resultados mais rápidos
2. **Busca**: Debounce de 500ms evita requisições desnecessárias
3. **Dados**: Atualizados automaticamente a cada 30 segundos
4. **Exportação**: Dados podem ser copiados da tabela para Excel

## 🆘 Suporte

Encontrou um bug?

1. Abra o console (F12)
2. Veja as mensagens de erro
3. Reporte com screenshot

## 📚 Documentação Completa

Para mais detalhes, consulte:
- `CADASTRAL_IMPLEMENTATION.md` - Documentação técnica
- `TEST_CADASTRAL.md` - Guia de testes
- `CADASTRAL_SUMMARY.md` - Resumo executivo

---

**Status**: ✅ Pronto para usar  
**Última atualização**: Outubro 2025
