# 🎯 Treynor - Tela de Performance de Equipe

## ✅ Implementação Concluída

### Alterações Realizadas

#### 1. **Componente Frontend** (`src/pages/TeamPerformance.tsx`)
- ✅ Página completa de análise de performance de equipes
- ✅ Filtros por data, vendedor, status e convênio
- ✅ Dashboard com KPIs (total propostas, valor financiado, liberado e parcelas)
- ✅ Gráficos interativos:
  - Gráfico de barras: Performance por Equipe (clicável para filtrar)
  - Gráfico de pizza: Distribuição por Status
- ✅ Tabela detalhada de propostas com:
  - Ordenação clicável por data de status e valor
  - Exportação para Excel e PDF
  - Cores de status (verde/vermelho/amarelo/azul)
- ✅ Dados da tabela `fact_proposals_newcorban` com data_status como principal

#### 2. **Rota no App.tsx** (`src/App.tsx`)
```tsx
<Route path="/treynor/performance" element={
  <PermissionRoute screenId="a8f109b6-ab42-4e0a-8f65-f2c8485c7199">
    <TeamPerformance />
  </PermissionRoute>
} />
```
- ✅ Route adicionada e importação do componente realizada
- ✅ ScreenId compartilhado com Produção Analytics para facilitar gerenciamento de permissões

#### 3. **Sidebar** (`src/components/layout/Sidebar.tsx`)
- ✅ Adicionado item "Performance de Equipe" no array `treynoItems`
  - Ícone: Users 👥
  - Descrição: "Análise de Performance de Equipes"
  - URL: `/treynor/performance`
- ✅ Nome corrigido de "Treyno" para **"Treynor"** em:
  - `sectionEmojis` (linha 268)
  - `sectionColors` (linha 279)
  - `CollapsibleNavSection` (linha 483)
- ✅ Importação do ícone `Users` adicionada

#### 4. **Backend Endpoints** (`server/server.js`)
Adicionadas 5 rotas API novas:

```javascript
// 1. GET /api/treynor/team-performance
// Retorna performance agregada por equipe com breakdown por status
// Query params: startDate, endDate, vendedor, status, convenio

// 2. GET /api/treynor/team-proposals
// Retorna propostas detalhadas de uma equipe
// Query params: startDate, endDate, equipe, vendedor, status, convenio

// 3. GET /api/treynor/vendedores
// Retorna lista de vendedores para filtro

// 4. GET /api/treynor/statuses
// Retorna lista de status para filtro

// 5. GET /api/treynor/convenios
// Retorna lista de convênios para filtro
```

#### 5. **Script SQL** (`sql/add_team_performance_screen.sql`)
- ✅ Script para registrar a tela no banco de dados (Supabase)
- ✅ UUID: `c8d9e0f1-a2b3-4c5d-6e7f-8a9b0c1d2e3f`
- ✅ Documentação das queries SQL para os endpoints

---

## 🚀 Como Usar

### 1. **Executar o Script SQL** (Supabase)
```bash
# Execute no SQL Editor do Supabase:
# Copie e cole o conteúdo de: sql/add_team_performance_screen.sql
```

### 2. **Iniciar o Servidor**
```bash
npm run servers
# Ou se usando dev mode completo:
npm run dev:full
```

### 3. **Acessar a Tela**
- Navegue até o Sidebar
- Clique em **"Treynor"** → **"Performance de Equipe"**
- Ou acesse diretamente: `http://localhost:5173/treynor/performance`

---

## 📊 Funcionalidades

### Filtros
- **Data Início/Fim**: Período de análise (padrão: início do mês até hoje)
- **Vendedor**: Filtro opcional por vendedor
- **Status**: Filtro opcional por status da proposta
- **Convênio**: Filtro opcional por convênio

### Dashboard
- **4 KPIs principais**: Total de propostas, Valor Financiado, Liberado e Parcelas
- **Auto-refresh**: 30 segundos após primeiro filtro aplicado
- **Limpeza de dados**: Botão para resetar todos os filtros

### Gráficos Interativos
1. **Performance por Equipe** (BarChart)
   - Clique nas barras para filtrar por equipe específica
   - Mostra total de propostas por time

2. **Distribuição por Status** (PieChart)
   - Visualização em pizza colorida
   - Tooltip com quantidades

### Tabela de Propostas
- **Ordenação dinâmica**: Clique nos headers para ordenar por:
  - Data de Status (padrão DESC)
  - Data de Cadastro
  - Valor Financiado
- **Exportação**:
  - Excel (.xlsx) com todas as colunas
  - PDF com layout formatado
- **Limite**: Máximo 500 registros por query

### Cores por Status
- 🟢 Verde: PAGO, AVERBADO, BOLETO QUITADO
- 🔴 Vermelho: CANCELADO, REJEITADO
- 🟡 Amarelo: PENDENTE, AGUARDANDO
- 🔵 Azul: Outros status

---

## 📋 Query SQL Principal

```sql
SELECT 
  cliente_nome,
  cliente_cpf,
  valor_financiado,
  valor_liberado,
  valor_parcela,
  valor_referencia,
  status_nome,
  produto_nome,
  convenio_nome,
  data_status,
  data_cadastro,
  vendedor_nome,
  equipe_nome
FROM fact_proposals_newcorban
WHERE data_status BETWEEN @startDate AND @endDate
  -- Filtros opcionais aplicados dinamicamente
ORDER BY data_status DESC
LIMIT 500;
```

---

## 🔧 Configuração de Permissões

A tela utiliza o **ScreenId compartilhado** com Produção Analytics:
- ScreenId: `a8f109b6-ab42-4e0a-8f65-f2c8485c7199`

Usuários com permissão para "Produção Analytics" têm acesso automático a "Performance de Equipe".

Para criar permissão separada, gere um novo UUID e atualize:
1. `sql/add_team_performance_screen.sql` → altere `id`
2. `src/App.tsx` → altere `screenId` no PermissionRoute

---

## 📝 Próximas Melhorias (Sugestões)

- [ ] Adicionar gráfico de evolução temporal das equipes
- [ ] Implementar ranking de vendedores por performance
- [ ] Adicionar alertas de performance abaixo de meta
- [ ] Integrar com gamificação/leaderboard
- [ ] Relatório de produtividade por hora/dia
- [ ] Comparativo entre equipes (semana, mês, trimestre)

---

## 🐛 Troubleshooting

### Erro "Cannot find name 'Users'"
✅ **Resolvido**: Adicionado ao import de lucide-react

### Dados não carregam
1. Verifique se o servidor está rodando: `npm run servers`
2. Confirme as datas estão no formato `YYYY-MM-DD`
3. Verifique logs do servidor para erros SQL

### Filtros não funcionam
1. Clique no botão "Filtrar Dados" após selecionar
2. Limpe os filtros e tente novamente
3. Verifique se a data_status tem dados no período selecionado

---

## 📚 Documentação Relacionada

- [ProducaoAnalyticsSimple.tsx](../src/pages/ProducaoAnalyticsSimple.tsx) - Tela de referência
- [App.tsx](../src/App.tsx) - Rotas da aplicação
- [Sidebar.tsx](../src/components/layout/Sidebar.tsx) - Navegação
- [server.js](../server/server.js) - API endpoints

---

**Status**: ✅ PRONTO PARA PRODUÇÃO

**Data**: 27 de Novembro de 2025

**Desenvolvedor**: GitHub Copilot
