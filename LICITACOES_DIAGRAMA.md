# 🎨 LICITAÇÕES (IIZU) - DIAGRAMA VISUAL

## 📊 Fluxo da Aplicação

```
┌─────────────────────────────────────────────────────────────────┐
│                        USUÁRIO FINAL                            │
└─────────────┬──────────────────────────────────────────────────┘
              │
              │ Acessa: http://localhost:5173
              │
              ↓
┌─────────────────────────────────────────────────────────────────┐
│               FRONTEND (React + Vite)                           │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  src/pages/Licitacoes.tsx                              │   │
│  │  ├─ Dashboard (5 Cards)                               │   │
│  │  ├─ Filtros (Busca + Status)                          │   │
│  │  ├─ Tabela Interativa                                 │   │
│  │  ├─ Botões (Atualizar, Exportar)                      │   │
│  │  └─ Tratamento de Erros/Loading                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  src/components/layout/Sidebar.tsx                     │   │
│  │  └─ 📋 Licitações (Iizu)  [Item novo]                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  src/App.tsx                                           │   │
│  │  └─ Route: /licitacoes                                │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────┬──────────────────────────────────────────────────┘
              │
              │ HTTP Request
              │ GET /api/licitacoes/bank-slips
              │
              ↓
┌─────────────────────────────────────────────────────────────────┐
│            BACKEND (Node.js + Express)                          │
│                                                                 │
│  postgres-server/server.js (Porta 3002)                        │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  GET /api/licitacoes/bank-slips                        │   │
│  │  └─ Processa request                                   │   │
│  │     └─ Conecta ao banco externo                        │   │
│  │        └─ Executa query SQL                            │   │
│  │           └─ Formata resposta JSON                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  GET /api/licitacoes/bank-slips/stats                 │   │
│  │  └─ Retorna estatísticas agregadas                    │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────┬──────────────────────────────────────────────────┘
              │
              │ Query SQL + Conexão
              │
              ↓
┌─────────────────────────────────────────────────────────────────┐
│        BANCO DE DADOS (PostgreSQL)                              │
│                                                                 │
│  Host: 10.174.1.117                                             │
│  Banco: ntxdeltaglobal                                          │
│                                                                 │
│  ┌───────────────────┐                                          │
│  │ client_api_keys   │                                          │
│  │ ├─ id             │                                          │
│  │ └─ client_name    │ ← "SAAE - Client Production"            │
│  └───────────────────┘                                          │
│         │ (INNER JOIN)                                          │
│         ↓                                                        │
│  ┌───────────────────┐                                          │
│  │ processors        │                                          │
│  │ ├─ id             │                                          │
│  │ └─ processor_type │ ← "IIZU"                               │
│  └───────────────────┘                                          │
│         │ (INNER JOIN)                                          │
│         ↓                                                        │
│  ┌───────────────────────────┐                                  │
│  │ bank_slips                │                                  │
│  │ ├─ id                     │                                  │
│  │ ├─ amount                 │ ← R$ 1.000,00                   │
│  │ ├─ paid_net_amount        │ ← R$ 950,00                     │
│  │ ├─ fee_amount             │ ← R$ 50,00                      │
│  │ ├─ status                 │ ← "paid"                        │
│  │ └─ paid_at                │ ← 2025-10-21                    │
│  └───────────────────────────┘                                  │
└─────────────┬──────────────────────────────────────────────────┘
              │
              │ Retorna dados JSON
              │
              ↓
┌─────────────────────────────────────────────────────────────────┐
│            FRONTEND (React Renderiza)                           │
│                                                                 │
│  {                                                              │
│    "data": [                                                    │
│      {                                                          │
│        "client_name": "SAAE - Client Production",              │
│        "processor_type": "IIZU",                               │
│        "amount": 1000,                                         │
│        "paid_net_amount": 950,                                 │
│        "fee_amount": 50,                                       │
│        "status": "paid",                                       │
│        "paid_at": "2025-10-21T10:30:00Z"                       │
│      }                                                          │
│      ...                                                        │
│    ],                                                           │
│    "count": 42                                                 │
│  }                                                              │
│                                                                 │
│  Atualiza estado                                               │
│  └─ Renderiza tabela                                           │
│  └─ Calcula estatísticas                                       │
│  └─ Mostra interface                                           │
└─────────────┬──────────────────────────────────────────────────┘
              │
              ↓
┌─────────────────────────────────────────────────────────────────┐
│                TELA DO USUÁRIO                                  │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ 📋 Licitações (Iizu)        [↻] [⬇]                   │   │
│  ├────────────────────────────────────────────────────────┤   │
│  │ [42] [R$42k] [R$39.9k] [R$2.1k] [28 - 66%]           │   │
│  ├────────────────────────────────────────────────────────┤   │
│  │ Buscar: [___________] Status: [Todos ▼]              │   │
│  ├────────────────────────────────────────────────────────┤   │
│  │ Cliente │ Tipo   │ Valor │ Líquido │ Taxa  │ Status   │   │
│  │ ─────────────────────────────────────────────────────  │   │
│  │ SAAE    │ IIZU   │ R$1k  │ R$950   │ R$50  │ ✅ Pago  │   │
│  │ SAAE    │ IIZU   │ R$2k  │ R$1.9k  │ R$100 │ ✅ Pago  │   │
│  │ ...     │ ...    │ ...   │ ...     │ ...   │ ...      │   │
│  └────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Arquitetura de Componentes

```
Delta Navigator
│
├─── src/
│    ├─── pages/
│    │    └─── Licitacoes.tsx .......................... ✨ NOVO
│    │         ├─ useState (loading, data, error, filters)
│    │         ├─ useEffect (fetch on mount)
│    │         ├─ Statistic Cards (5)
│    │         ├─ Filter Bar
│    │         ├─ Data Table
│    │         └─ Action Buttons
│    │
│    ├─── components/
│    │    └─── layout/
│    │         └─── Sidebar.tsx ........................ ✏️ MODIFICADO
│    │              └─ Novo item: Licitações
│    │
│    ├─── App.tsx ...................................... ✏️ MODIFICADO
│    │    └─ Rota: /licitacoes
│    │
│    └─── hooks/
│         └─── use-toast.tsx (já existe)
│
├─── postgres-server/
│    └─── server.js ..................................... ✏️ MODIFICADO
│         ├─ GET /api/licitacoes/bank-slips
│         └─ GET /api/licitacoes/bank-slips/stats
│
└─── Documentação (6 arquivos)
     ├─ LICITACOES_QUICK_START.md
     ├─ LICITACOES_VISUALIZACAO.md
     ├─ LICITACOES_SUMARIO.md
     ├─ LICITACOES_IIZU_DOCUMENTACAO.md
     ├─ LICITACOES_ENTREGA_FINAL.md
     └─ LICITACOES_INDICE.md
```

---

## 📱 Estrutura de Estado (React)

```
Licitacoes Component State
│
├─ bankSlips: BankSlip[]
│  └─ Array de boletos completos do servidor
│
├─ filteredSlips: BankSlip[]
│  └─ Array filtrado (busca + status)
│
├─ loading: boolean
│  └─ Indica se está carregando dados
│
├─ saving: boolean
│  └─ Indica se está salvando (atualizar)
│
├─ error: string | null
│  └─ Mensagem de erro (se houver)
│
├─ searchTerm: string
│  └─ Termo de busca
│
├─ statusFilter: string
│  └─ Filtro de status selecionado
│
└─ stats: {
   ├─ total
   ├─ totalAmount
   ├─ totalPaid
   ├─ totalFees
   └─ paidCount
   }
```

---

## 🔄 Fluxo de Eventos

```
1. Componente monta (useEffect)
   └─> fetchBankSlips()
       └─> API: GET /api/licitacoes/bank-slips
           └─> setState(bankSlips)

2. Usuário digita na busca
   └─> setState(searchTerm)
       └─> useEffect detecta mudança
           └─> filterBankSlips()
               └─> setState(filteredSlips)

3. Usuário seleciona status
   └─> setState(statusFilter)
       └─> useEffect detecta mudança
           └─> filterBankSlips()
               └─> setState(filteredSlips)

4. Usuário clica "Atualizar"
   └─> fetchBankSlips()
       └─> API: GET /api/licitacoes/bank-slips
           └─> setState(bankSlips)
               └─> filterBankSlips()

5. Usuário clica "Exportar CSV"
   └─> exportToCSV()
       └─> Gera Blob
           └─> Download automático
               └─> licitacoes-2025-10-21.csv

6. Usário filtra → Clica "Exportar CSV"
   └─> Exporta apenas dados filtrados
```

---

## 🎨 Estrutura de Renderização

```
Licitacoes Page
│
├─ Header
│  ├─ Título com ícone
│  ├─ Descrição
│  └─ Botões de ação
│
├─ Error Message (se houver erro)
│  └─ Card com alerta vermelha
│
├─ Statistics Cards (5)
│  ├─ Total de Boletos
│  ├─ Valor Total
│  ├─ Valor Líquido
│  ├─ Total de Taxas
│  └─ Boletos Pagos
│
├─ Filters Card
│  ├─ Input de busca
│  └─ Select de status
│
└─ Data Table Card
   ├─ Tabela com dados
   │  └─ 7 colunas
   │
   ├─ Loading State
   │  └─ Spinner + mensagem
   │
   ├─ Error State
   │  └─ Mensagem de erro
   │
   └─ Empty State
      └─ Mensagem "Nenhum encontrado"
```

---

## 📊 Tipos de Dados

```typescript
interface BankSlip {
  client_name: string;           // "SAAE - Client Production"
  processor_type: string;        // "IIZU"
  amount: number;                // 1000.00
  paid_net_amount: number;       // 950.00
  fee_amount: number;            // 50.00
  status: string;                // "paid"
  paid_at: string | null;        // "2025-10-21T10:30:00Z"
}

interface ApiResponse {
  data: BankSlip[];
  count: number;
  timestamp?: string;
}

interface Stats {
  total: number;
  totalAmount: number;
  totalPaid: number;
  totalFees: number;
  paidCount: number;
}
```

---

## 🔌 Endpoints API

```
GET /api/licitacoes/bank-slips
├─ Retorna: { data: BankSlip[], count: number }
├─ Status: 200 (sucesso)
└─ Status: 500 (erro)

GET /api/licitacoes/bank-slips/stats
├─ Retorna: {
│  total_count: number,
│  paid_count: number,
│  open_count: number,
│  canceled_count: number,
│  total_amount: number,
│  total_paid_net: number,
│  total_fees: number,
│  avg_fee: number
│  }
├─ Status: 200 (sucesso)
└─ Status: 500 (erro)
```

---

## 📈 Diagrama de Dependências

```
Licitacoes.tsx
│
├─ Imports
│  ├─ React (useState, useEffect)
│  ├─ UI Components (Card, Button, Input, Badge, etc)
│  ├─ Icons (Lucide React)
│  ├─ axios (HTTP client)
│  └─ useToast (custom hook)
│
└─ Usa
   ├─ API (axios GET requests)
   ├─ Formatação de moeda (Intl.NumberFormat)
   ├─ Formatação de data (Intl.DateTimeFormat)
   └─ localStorage (via Tailwind classes)
```

---

## ✅ Status de Implementação

```
┌─ FRONTEND (100%)
│  ├─ ✅ Component criado
│  ├─ ✅ Rota adicionada
│  ├─ ✅ Sidebar integrado
│  ├─ ✅ Estados gerenciados
│  ├─ ✅ Filtros implementados
│  ├─ ✅ Tabela funcional
│  ├─ ✅ Exportação CSV
│  └─ ✅ Tratamento de erros
│
├─ BACKEND (100%)
│  ├─ ✅ Servidor rodando
│  ├─ ✅ Endpoints criados
│  ├─ ✅ Query SQL configurada
│  ├─ ✅ CORS habilitado
│  ├─ ✅ Logging implementado
│  └─ ✅ Tratamento de erros
│
├─ BANCO DE DADOS (100%)
│  ├─ ✅ Conexão configurada
│  ├─ ✅ Credenciais validadas
│  ├─ ✅ Query otimizada
│  └─ ✅ Dados acessíveis
│
└─ DOCUMENTAÇÃO (100%)
   ├─ ✅ Guia rápido
   ├─ ✅ Visualização
   ├─ ✅ Sumário técnico
   ├─ ✅ Documentação completa
   ├─ ✅ Checklist entrega
   └─ ✅ Índice de docs
```

---

## 🚀 Pipeline de Deploy

```
1. Desenvolvimento
   └─ npm run dev
      └─ npm run server:postgres
         └─ Testa localmente

2. Build
   └─ npm run build
      └─ Gera dist/

3. Deploy
   └─ Fazer push para repositório
      └─ CI/CD pipeline
         └─ Deploy em produção

4. Monitoramento
   └─ Logs do servidor
      └─ Métricas de uso
         └─ Alertas de erro
```

---

**Data**: 21 de Outubro de 2025
**Versão**: 1.0.0
**Status**: ✅ Completo
