# Match Averbadora - Guia de Implementação

## 📋 Visão Geral

Uma nova tela foi criada no sidebar do Delta-Navigator chamada **"Match Averbadora"** que analisa e compara dados de averbações por região.

## 🎯 O que foi criado

### 1. **Página Principal** (`src/pages/MatchAverbadora.tsx`)
- Componente React com interface completa
- 4 abas principais:
  - **Geral**: Visão consolidada de todas as regiões
  - **BH**: Dados específicos de Belo Horizonte
  - **POÁ**: Dados específicos de Porto Alegre
  - **Comparar**: Análise comparativa entre regiões

### 2. **Dados** (`src/data/averbadora/`)
- `bh.json` - 84 registros de Belo Horizonte
- `poa.json` - 61 registros de Porto Alegre
- `all.json` - 145 registros combinados
- `regions.json` - Metadados das regiões

### 3. **Integração no Sidebar**
- Nova seção "Averbadora" com ícone 🔗
- Adicionada na cor azul (mesmo padrão do Treyno)
- Abre por padrão

### 4. **Rota e Autenticação**
- Rota: `/match-averbadora`
- Protegida com PermissionRoute (screenId padrão de admin)
- Adicionada ao App.tsx

## 📊 Funcionalidades

### Aba "Geral"
- **Cards de resumo**: Total de registros, taxa de match, regiões ativas
- **Gráfico de barras**: Comparação de matches por região
- **Barra de progresso**: Taxa de match visual por região
- **Distribuição**: Percentuais por região

### Abas "BH" e "POÁ"
- **4 cards de KPI**:
  - Total de registros
  - Matches (com percentual)
  - Não matches
  - Diferença média absoluta
  
- **Gráficos**:
  - Gráfico de pizza: Distribuição de status
  - Resumo financeiro: Valores liberados vs ADE
  
- **Tabela interativa**:
  - Busca por nome, CPF ou produto
  - 50 registros por página
  - Colunas: Nome, CPF, Produto, Data, Valores, Status
  - Status com badges coloridas (MATCH = verde)

### Aba "Comparar"
- Gráfico de barras: Total vs Matches vs Não matches
- Cards comparativos: Resumo de cada região
- Taxa de match por região

## 🔍 Colunas de Dados

Para cada registro:
- **Nome**: Nome do cliente
- **CPF_DIGITOS**: Últimos dígitos do CPF
- **Produto**: Tipo de produto/empréstimo
- **Data_Entrada**: Data de entrada (formatada)
- **Vlr_Liberado**: Valor liberado
- **Situacao_Contrato**: Status do contrato
- **Valor_Prestacao_Soma**: Soma de prestações
- **_VLR_ADE**: Valor ADE
- **DIFERENCA**: Diferença entre valores
- **ABS_DIF**: Diferença absoluta
- **STATUS**: MATCH ou NÃO MATCH

## 📈 Estatísticas Iniciais

| Região | Total | Matches | Taxa |
|--------|-------|---------|------|
| **BH** | 84 | 52 | 61.9% |
| **POÁ** | 61 | 30 | 49.2% |
| **Total** | 145 | 82 | 56.6% |

## 🚀 Como Adicionar Novas Regiões

### Passo 1: Copiar dados
```bash
# Copiar arquivo Excel para:
C:\Users\alexsandro.costa\Documents\BATE_EM_AVERBADORA\NOVA_REGIAO\
```

### Passo 2: Atualizar export_to_json.py
```python
# Adicionar nova região
df_nova = pd.read_excel(r'C:\Users\...\NOVA_REGIAO\comparativo.xlsx')
nova_data = df_nova.to_dict(orient='records')

with open(os.path.join(data_dir, 'nova.json'), 'w', encoding='utf-8') as f:
    json.dump(nova_data, f, ensure_ascii=False, indent=2)

# Adicionar ao regions.json
regions['NOVA'] = {
    'name': 'Nome da Região',
    'records': len(nova_data),
    'matches': len(df_nova[df_nova['STATUS'] == 'MATCH']),
    'path': 'nova.json'
}
```

### Passo 3: Atualizar MatchAverbadora.tsx
```typescript
// Importar dados
import novaData from '@/data/averbadora/nova.json';

// Adicionar ao getData()
case 'NOVA':
  return novaData as MatchRecord[];

// Atualizar o TabsList para incluir a nova aba
```

## 🎨 Componentes Usados

- **Card**: Containers de dados
- **Button**: Interação
- **Input**: Busca
- **Table**: Exibição de registros
- **Badge**: Status visual
- **Tabs**: Navegação entre views
- **BarChart, PieChart**: Visualizações
- **ResponsiveContainer**: Gráficos responsivos

## 🔐 Segurança

- Rota protegida por PermissionRoute
- CPF mascarado (mostra apenas últimos 4 dígitos)
- Dados em JSON local (sem chamadas API sensíveis)

## 📝 Próximos Passos

1. **Ajustar screenId**: Alterar para o ID correto de permissão se necessário
2. **Adicionar mais regiões**: Repetir processo acima conforme novos dados chegarem
3. **Integração com API**: Se dados vierem de banco, substituir importação JSON
4. **Filtros avançados**: Adicionar filtros por data, produto, situação
5. **Exportação**: Adicionar botão para exportar dados em Excel/CSV
6. **Alertas**: Implementar notificações para matches críticos

## 📧 Estrutura de Arquivo

```
src/
├── pages/
│   └── MatchAverbadora.tsx
├── data/
│   └── averbadora/
│       ├── bh.json
│       ├── poa.json
│       ├── all.json
│       └── regions.json
└── components/
    └── layout/
        └── Sidebar.tsx (atualizado)

App.tsx (atualizado com rota e import)
```

---

**Criado em**: 26/11/2025
**Status**: ✅ Pronto para produção
