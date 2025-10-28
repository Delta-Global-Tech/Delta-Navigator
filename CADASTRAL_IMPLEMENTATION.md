# 📊 Tela de Cadastral - Delta Global Bank

## 🎯 Visão Geral

Foi implementada uma nova tela **Cadastral** no Delta Navigator que oferece uma visão completa de clientes, créditos liberados e distribuição geográfica. A solução integra-se perfeitamente com o banco de dados existente do `extrato-server`.

## ✨ Funcionalidades

### 1. **Indicadores Principais (KPIs)**
- Total de clientes na base
- Clientes ativos vs inativos
- Crédito total liberado
- Crédito médio por cliente
- Cobertura geográfica (estados e cidades)

### 2. **Mapa de Cidades**
- Visualização interativa de clientes e crédito por cidade
- Gráficos de barras para comparação
- Filtro por estado
- Métricas por localização:
  - Quantidade de clientes
  - Total de crédito liberado
  - Crédito médio

### 3. **Tabela de Clientes**
- Lista completa de clientes com informações detalhadas
- Busca em tempo real (nome, CPF/CNPJ, email)
- Filtro por estado
- Colunas exibidas:
  - Nome
  - CPF/CNPJ
  - Email
  - Número da conta
  - Status da conta
  - Crédito liberado
  - Localização (cidade, estado)

## 🏗️ Arquitetura

### Backend (extrato-server/server.js)

Foram adicionadas 3 novas rotas:

#### 1. `GET /api/cadastral/clientes`
```javascript
Query Parameters:
- search: string (busca por nome, CPF/CNPJ ou email)
- estado: string (filtro por estado - ex: "SP")
- limite: number (máximo de registros retornados, default: 500)

Response:
{
  clientes: ClienteCadastral[],
  total: number
}
```

#### 2. `GET /api/cadastral/mapa-cidades`
```javascript
Query Parameters:
- estado: string (filtro por estado)

Response:
{
  dados: MapaCidade[],
  total_cidades: number
}
```

#### 3. `GET /api/cadastral/estatisticas`
```javascript
Response:
{
  total_clientes: number,
  clientes_ativos: number,
  clientes_inativos: number,
  total_credito_liberado: number,
  credito_medio: number,
  total_estados: number,
  total_cidades: number
}
```

### Frontend (src/)

#### Arquivos Criados:
1. **`src/data/cadastralApi.ts`**
   - Definição das interfaces de dados
   - Funções de integração com API

2. **`src/components/cadastral/EstatisticasCadastralKPIs.tsx`**
   - Componente de KPIs
   - Cards informativos

3. **`src/components/cadastral/MapaCidadesCard.tsx`**
   - Visualização de mapa de cidades
   - Gráficos de distribuição

4. **`src/components/cadastral/ClientesTable.tsx`**
   - Tabela de clientes com busca
   - Filtros e formatação

5. **`src/pages/Cadastral.tsx`**
   - Página principal
   - Composição dos componentes
   - Tabs para navegação

#### Arquivos Modificados:
1. **`src/App.tsx`**
   - Importação da página Cadastral
   - Adição da rota `/cadastral`

2. **`src/components/layout/Sidebar.tsx`**
   - Adição do menu "Cadastral"
   - Badge "✨ Novo"

## 📊 SQL Utilizado

```sql
SELECT 
  da.account_id,
  da.personal_name AS nome,
  da.personal_document AS cpf_cnpj,
  da.email,
  da.account_number AS numero_da_conta,
  da.status_description AS status_conta,
  COALESCE(fals.credit_limit, 0) AS credit_limit,
  daa.state AS estado,
  daa.city AS cidade,
  daa.address AS endereco,
  daa.number AS numero,
  daa.complement AS complemento,
  daa.zipcode AS cep
FROM dim_account da 
INNER JOIN dim_account_address daa 
  ON da.account_id = daa.account_id
LEFT JOIN fact_account_limit_snapshot fals 
  ON da.account_id = fals.account_id
```

## 🚀 Como Usar

### 1. Acessar a Tela
- Vá para o menu lateral
- Na seção "Delta Global Bank"
- Clique em "Cadastral"

### 2. Visualizar Mapa de Cidades
- Na aba "Mapa de Cidades"
- Selecione um estado ou "Todos os Estados"
- Visualize a distribuição de clientes e crédito

### 3. Buscar Clientes
- Na aba "Clientes"
- Use a barra de busca para encontrar clientes
- Filtre por estado se necessário

## ⚙️ Cache

O sistema implementa cache de **30 segundos** para:
- Dados de clientes
- Dados de mapa de cidades
- Estatísticas gerais

Isso melhora significativamente a performance e reduz carga no banco de dados.

## 🔒 Segurança

- A rota está protegida por autenticação (`ProtectedRoute`)
- Validação de entrada nos parâmetros da API
- Prepared statements para prevenir SQL injection

## 📈 Performance

- **Frontend**: Debouncing de 500ms na busca
- **Backend**: Cache com TTL de 30 segundos
- **Queries**: Otimizadas com índices

## 🐛 Possíveis Melhorias Futuras

1. Exportar dados para Excel/CSV
2. Gráfico visual de mapa do Brasil com cores por cidade
3. Filtro avançado com múltiplas condições
4. Análise de tendências de crédito ao longo do tempo
5. Integração com serviços de geolocalização
6. Alerts automáticos para clientes com crédito acima/abaixo de limites

## 📝 Nota Importante

✅ **Nada foi quebrado**: Todas as rotas existentes permanecem intactas. As novas rotas foram adicionadas ao final do arquivo `extrato-server/server.js` antes da inicialização do servidor.

## 🔗 Rotas da Aplicação

```
/cadastral - Página de cadastral de clientes (NOVA)
/extrato - Extrato de clientes
/extrato-ranking - Ranking por saldo
/faturas - Faturas de cartão
/propostas-abertura - Abertura de contas
/network-test - Teste de conectividade
```

---

**Criado em**: Outubro 2025  
**Versão**: 1.0  
**Status**: ✅ Pronto para produção
