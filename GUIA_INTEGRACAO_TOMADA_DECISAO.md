# 🔗 Guia de Integração - Tela de Tomada de Decisão Refatorada

## 📍 Localização dos Arquivos

```
src/
├── pages/
│   ├── TomadaDecisao.tsx         ← Original (ainda funciona)
│   └── TomadaDecisaoV2.tsx       ← ✨ NOVA VERSÃO (refatorada)
│
└── components/
    └── ui/
        ├── card.tsx
        ├── badge.tsx
        └── button.tsx
```

## ✅ Pré-requisitos

Certifique-se de que você tem instalados:

```bash
npm install lucide-react          # Ícones
npm install xlsx                  # Exportação Excel
npm install @/components/ui/*     # Componentes UI
```

## 🚀 Opções de Integração

### Opção 1: Rota Separada (Recomendado para Testes)

Mantenha ambas as versões e acesse via rotas diferentes:

```tsx
// src/App.tsx ou seu arquivo de rotas

import TomadaDecisao from '@/pages/TomadaDecisao';
import TomadaDecisaoAnalytical from '@/pages/TomadaDecisaoV2';

const router = [
  {
    path: '/analise/tomada-decisao',
    element: <TomadaDecisao /> // Versão original
  },
  {
    path: '/analise/tomada-decisao-v2',
    element: <TomadaDecisaoAnalytical /> // ✨ Nova versão
  }
];
```

**URLs**:
- Antiga: `http://localhost:5173/analise/tomada-decisao`
- Nova: `http://localhost:5173/analise/tomada-decisao-v2`

---

### Opção 2: Substituição Completa (Após Validação)

Substitua a versão original pela nova:

```tsx
// src/App.tsx

import TomadaDecisaoAnalytical from '@/pages/TomadaDecisaoV2';

const router = [
  {
    path: '/analise/tomada-decisao',
    element: <TomadaDecisaoAnalytical /> // ✨ Versão nova como padrão
  }
];
```

---

### Opção 3: Aliás/Atalho

Crie um alias para facilitar o uso:

```tsx
// src/pages/TomadaDecisao.tsx (novo)

// Simples re-export
export { default } from './TomadaDecisaoV2';
```

---

## 🔧 Configuração Esperada do Backend

O endpoint `/api/contratos/tomada-decisao` deve retornar a seguinte estrutura:

### Request

```http
GET /api/contratos/tomada-decisao
Authorization: Bearer {token}
```

### Response

```json
{
  "resumo_executivo": {
    "total_operacoes": 2345,
    "volume_total": 12500000,
    "ticket_medio_geral": 5328,
    "produtos_ativos": 12,
    "regioes_ativas": 28,
    "instituicoes_ativas": 15
  },
  "analise_produtos": [
    {
      "produto": "Empréstimo Pessoal",
      "operacoes": 523,
      "valor_liberado": 2300000,
      "valor_solicitado": 2600000,
      "clientes_unicos": 182,
      "ticket_medio": 4400,
      "eficiencia": 115.5,
      "participacao": 12.5
    }
    // ... mais produtos
  ],
  "analise_geografica": [
    {
      "cidade": "São Paulo",
      "uf": "SP",
      "operacoes": 450,
      "valor_total": 3200000,
      "diversificacao": 8,
      "produtos": ["Empréstimo", "Cartão"],
      "ticket_medio": 7111
    }
    // ... mais regiões
  ],
  "analise_instituicoes": [
    {
      "instituicao": "Caixa Econômica",
      "operacoes": 234,
      "volume": 1500000,
      "portfolio": 8,
      "produtos": ["Empréstimo"],
      "volume_medio": 6410
    }
    // ... mais instituições
  ],
  "alertas_criticos": [
    {
      "tipo": "concentracao",
      "titulo": "Concentração de Risco Elevada",
      "descricao": "45% do volume concentrado em TOP 3 clientes",
      "urgencia": "CRÍTICA",
      "acao": "Expandir base de clientes"
    }
    // ... mais alertas
  ],
  "analise_comportamental": {
    "score_fidelidade": 78,
    "total_clientes": 1250,
    "perfil_risco": {
      "baixo": {
        "quantidade": 850,
        "valor_medio": 3200
      },
      "medio": {
        "quantidade": 300,
        "valor_medio": 5100
      },
      "alto": {
        "quantidade": 100,
        "valor_medio": 8900
      }
    }
  },
  "concentracao_risco": {
    "por_cliente": {
      "percentual_top_10": 45.3,
      "valor_medio_top_10": 562500,
      "nivel_risco": "ALTO"
    },
    "por_produto": {
      "percentual_top_3": 73.8,
      "produto_principal": "Empréstimo Pessoal",
      "nivel_risco": "ALTO"
    }
  },
  "insights_revolucionarios": [
    {
      "tipo": "sazonal",
      "titulo": "Padrão Sazonal Detectado",
      "mes_critico": "Setembro",
      "concentracao": "42%",
      "insight": "Volume concentrado em setembro e março",
      "acao_recomendada": "Preparar capacidade para picos",
      "oportunidade": "Antecipar demanda com campanhas"
    }
    // ... mais insights
  ],
  "matriz_bcg_produtos": [
    {
      "produto": "Empréstimo Pessoal",
      "crescimento": 25.3,
      "participacao": 18.5,
      "categoria_bcg": "ESTRELA",
      "valor_liberado": 2300000,
      "recomendacao_estrategica": "Investir agressivamente em expansão"
    }
    // ... mais produtos
  ],
  "previsoes_inteligentes": {
    "potencial_receita_adicional": 2500000,
    "produtos_com_maior_potencial": [
      {
        "produto": "Empréstimo Pessoal",
        "operacoes": 523,
        "valor_liberado": 2300000,
        "valor_solicitado": 2600000,
        "clientes_unicos": 182,
        "ticket_medio": 4400,
        "eficiencia": 115.5,
        "participacao": 12.5
      }
    ],
    "clientes_em_risco_churn": 45,
    "score_saude_portfolio": 78
  },
  "oportunidades_crosssell": [
    {
      "produto": "Empréstimo",
      "clientes_potenciais": 342,
      "receita_potencial": 4200000
    }
    // ... mais oportunidades
  ],
  "analise_tendencias": {
    "timeline_completa": [
      {
        "periodo": "Janeiro/2025",
        "mes": 1,
        "ano": 2025,
        "operacoes": 156,
        "volume": 850000,
        "crescimento_mensal": 5.2
      }
      // ... 12 meses
    ],
    "tendencias_por_categoria": [
      {
        "categoria": "Empréstimo",
        "velocidade_crescimento": 8.5,
        "tendencia": "em_alta",
        "previsao_proximo_mes": 920000,
        "confianca_previsao": 0.87
      }
      // ... mais categorias
    ],
    "crescimento_medio_mercado": 7.3,
    "previsao_receita_total": 15200000,
    "categorias_em_alta": [],
    "categorias_em_queda": []
  },
  "scoring_oportunidades": [
    {
      "produto": "Empréstimo",
      "score_final": "85",
      "categoria_investimento": "alta_prioridade",
      "componentes_score": {
        "volume": "90",
        "crescimento": "80",
        "diversificacao": "75",
        "eficiencia": "85",
        "potencial": "92"
      },
      "tendencia_mercado": "crescimento_forte",
      "previsao_proximo_mes": 920000,
      "acao_recomendada": "Aumentar investimento em marketing e equipe"
    }
    // ... mais produtos
  ]
}
```

---

## 🧪 Testando a Integração

### 1. Verificar Compilação

```bash
npm run build
```

Certifique-se de que não há erros TypeScript.

### 2. Testar em Desenvolvimento

```bash
npm run dev
```

Acesse: `http://localhost:5173/analise/tomada-decisao-v2`

### 3. Validar Dados

Abra o DevTools (F12) e verifique:
- Console: Logs de carregamento e erros
- Network: Requisição para `/api/contratos/tomada-decisao`
- Application: Token de autenticação (se aplicável)

### 4. Funcionalidades a Testar

- ✅ Carregamento inicial de dados
- ✅ Atualizar dados
- ✅ Exportar para Excel
- ✅ Alternar Grid/List
- ✅ Expandir/colapsar seções
- ✅ Filtrar produtos por risco
- ✅ Expandir cards de produtos
- ✅ Toast notifications
- ✅ Responsividade (mobile, tablet, desktop)

---

## 🔍 Troubleshooting

### "Cannot find name 'TomadaDecisaoAnalytical'"

```
Solução: Importe da localização correta
import TomadaDecisaoAnalytical from '@/pages/TomadaDecisaoV2';
```

### "Erro ao carregar dados"

```
Verifique:
1. Endpoint URL está correto: ${API_URLS.CONTRATOS}/api/contratos/tomada-decisao
2. Backend está rodando
3. Token de autenticação é válido
4. CORS está configurado
```

### "Estilos não aplicados"

```
Verifique:
1. Tailwind CSS está configurado
2. Arquivo de estilos global está importado
3. Tailwind config inclui src/pages/**
```

### "Ícones não aparecem"

```
Solução: Instale lucide-react
npm install lucide-react
```

### "Exportação Excel não funciona"

```
Solução: Instale xlsx
npm install xlsx
```

---

## 📊 Estrutura de Tipos TypeScript

Todos os tipos estão definidos no arquivo `TomadaDecisaoV2.tsx`:

```typescript
// Principais tipos exportáveis
export interface ResumoExecutivo { ... }
export interface AnaliseProduto { ... }
export interface MatrizBCG { ... }
export interface AlertaCritico { ... }
export interface TomadaDecisaoData { ... }
// ... e mais
```

Se precisar usar em outros arquivos:

```tsx
import { ResumoExecutivo, AnaliseProduto } from '@/pages/TomadaDecisaoV2';
```

---

## 🎯 Próximos Passos Recomendados

1. **Validação com Dados Reais**
   - Teste com dados de produção
   - Verifique performance com grandes volumes
   - Monitore tempo de carregamento

2. **Feedback de Usuários**
   - Colete feedback de executivos
   - Refine KPIs e métricas
   - Ajuste layout conforme necessário

3. **Otimizações Futuras**
   - Adicionar gráficos interativos (Chart.js, Recharts)
   - Implementar real-time updates via WebSocket
   - Adicionar filtros avançados
   - Criar dashboard personalizável

4. **Documentação**
   - Documentar todas as métricas
   - Criar guia de uso para usuários finais
   - Registrar decisões arquiteturais

---

## 📞 Suporte

Para problemas ou sugestões:

1. Verifique os logs do console
2. Consulte o arquivo de troubleshooting acima
3. Abra uma issue no repositório
4. Entre em contato com o time de desenvolvimento

---

**Última atualização**: 20/10/2025
**Versão**: 1.0.0
**Status**: ✅ Pronto para Produção
