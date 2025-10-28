# 📸 LICITAÇÕES - VISUALIZAÇÃO DA INTERFACE

## 🎯 O Que o Usuário Verá

---

## 1️⃣ NO SIDEBAR (Menu Lateral)

```
┌──────────────────────────┐
│  Δ Delta Global Center   │
│  v2.1.0                  │
├──────────────────────────┤
│  🚀 SISTEMA DE PAGAMENTO │
├──────────────────────────┤
│                          │
│ 🏢 TREYNOR             │
│   ├─ Dashboard         │
│   └─ Produção Analytics│
│                          │
│ 🏦 FGTS                │
│   ├─ Funil             │
│   └─ Propostas         │
│                          │
│ 🏗️ EM                 │
│   ├─ Posição Contratos │
│   ├─ Desembolso        │
│   ├─ Tomada de Decisão │
│   ├─ Comparativo...    │
│   └─ ...               │
│                          │
│ 💳 DELTA GLOBAL BANK   │
│   ├─ Cadastral         │
│   ├─ Extrato           │
│   ├─ Ranking Extrato   │
│   ├─ Faturas           │
│   ├─ Propostas Abertura│
│   └─ Network Test      │
│                          │
│ ⚙️ BACKOFFICE DELTA    │ ← EXPANDIR
│   ├─ Alterar Limite PIX│
│   └─ 📋 Licitações ✨  │ ← NOVO!
│                          │
└──────────────────────────┘
```

---

## 2️⃣ AO CLICAR EM "LICITAÇÕES (IIZU)"

A página carrega com:

### HEADER
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   📋 Licitações (Iizu)              [↻ Atualizar] [⬇ Exportar CSV]
   Gestão e acompanhamento de boletos bancários
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### CARDS DE ESTATÍSTICAS
```
┌─────────────┬─────────────┬─────────────┬─────────────┬─────────────┐
│   TOTAL     │   VALOR     │   LÍQUIDO   │    TAXAS    │   PAGOS     │
│  BOLETOS    │   TOTAL     │    (R$)     │    (R$)     │   (%)       │
├─────────────┼─────────────┼─────────────┼─────────────┼─────────────┤
│             │             │             │             │             │
│     42      │  R$ 42.000  │ R$ 39.900   │  R$ 2.100   │ 28 (66%)    │
│             │             │             │             │             │
│ Registros   │ Valor bruto │ Após desct  │ Descontos   │ Status pago │
│ totais      │             │             │ aplicados   │             │
└─────────────┴─────────────┴─────────────┴─────────────┴─────────────┘
```

### FILTROS
```
┌─────────────────────────────────────────────────────────────────┐
│  Filtros                                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Buscar por cliente ou tipo                                    │
│  [_________________________________] ← Digite para filtrar    │
│                                                                 │
│  Filtrar por status                                            │
│  [Todos ▼]                                                     │
│   ├─ Todos os status                                           │
│   ├─ Pago                                                      │
│   ├─ Aberto                                                    │
│   ├─ Cancelado                                                 │
│   ├─ Expirado                                                  │
│   └─ Atrasado                                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### TABELA DE BOLETOS
```
┌────────────────────────────────────────────────────────────────────────────────┐
│ Boletos Bancários (42 de 42 registros)                                        │
├──────────────────┬──────────────────┬──────────┬──────────┬──────────┬────────┤
│ Cliente          │ Tipo Processador │ V. Total │ Líquido  │  Taxa   │ Status │
├──────────────────┼──────────────────┼──────────┼──────────┼──────────┼────────┤
│ SAAE - Prod      │ IUGU             │ R$ 1.000 │ R$ 950   │ R$ 50   │ ✅ Pgo│
│ SAAE - Prod      │ IUGU             │ R$ 2.000 │ R$ 1.900 │ R$ 100  │ ✅ Pgo│
│ SAAE - Prod      │ IUGU             │ R$ 1.500 │ R$ 1.500 │ R$ 0    │ 🟨 Abr│
│ SAAE - Prod      │ IUGU             │ R$ 3.000 │ R$ 2.850 │ R$ 150  │ 🟨 Abr│
│ SAAE - Prod      │ IIZU             │ R$ 2.500 │ R$ 2.500 │ R$ 0    │ ✅ Pgo│
│ ...              │ ...              │ ...      │ ...      │ ...     │ ...    │
└──────────────────┴──────────────────┴──────────┴──────────┴──────────┴────────┘
```

---

## 3️⃣ CORES E STATUS

### Cores dos Badges de Status

```
✅ PAGO (Verde)
   Fundo: #10b981 (Verde - Emerald 500)
   Texto: Branco
   Significado: Boleto já foi pago

🟨 ABERTO (Amarelo)
   Fundo: #f59e0b (Amarelo - Amber 500)
   Texto: Preto
   Significado: Boleto aguardando pagamento

❌ CANCELADO (Vermelho)
   Fundo: #ef4444 (Vermelho - Red 500)
   Texto: Branco
   Significado: Boleto foi cancelado

⚠️ EXPIRADO (Cinza)
   Fundo: #6b7280 (Cinza - Gray 500)
   Texto: Branco
   Significado: Prazo expirou

⏰ ATRASADO (Laranja)
   Fundo: #f97316 (Laranja - Orange 500)
   Texto: Branco
   Significado: Boleto venceu e não foi pago
```

---

## 4️⃣ INTERAÇÕES DO USUÁRIO

### A) FILTRO DE BUSCA
```
Usuário digita "SAAE" no campo de busca
           ↓
Tabela filtra em TEMPO REAL
           ↓
Mostra apenas linhas com "SAAE"
           ↓
Se não houver resultados:
   "Nenhum boleto encontrado com os filtros aplicados"
```

### B) FILTRO DE STATUS
```
Usuário seleciona "Pago" no dropdown
           ↓
Tabela filtra em tempo real
           ↓
Mostra apenas boletos com status "paid"
           ↓
Estatísticas atualizam automaticamente
```

### C) BOTÃO ATUALIZAR
```
Usuário clica em [↻ Atualizar]
           ↓
Ícone gira enquanto carrega
           ↓
Requisição vai ao servidor: GET /api/licitacoes/bank-slips
           ↓
Dados recarregam
           ↓
Toast de sucesso: "Dados recarregados"
```

### D) BOTÃO EXPORTAR CSV
```
Usuário clica em [⬇ Exportar CSV]
           ↓
Arquivo gerado: licitacoes-2025-10-21.csv
           ↓
Arquivo é baixado automaticamente
           ↓
Toast de sucesso: "42 registros exportados"
```

---

## 5️⃣ TEMA VISUAL

### Paleta de Cores
```
Fundo Principal:  #111827 (Cinza muito escuro)
Fundo Secundário: #1f2937 (Cinza escuro)
Fundo Cards:      #1f2937 (Cinza escuro com borda)
Texto Principal:  #f3f4f6 (Branco off-white)
Texto Secundário: #9ca3af (Cinza claro)
Destaque:         #f97316 (Laranja - marca)
Sucesso:          #10b981 (Verde)
Aviso:            #f59e0b (Amarelo)
Erro:             #ef4444 (Vermelho)
```

### Tipografia
```
Título Principal:  3xl, bold, branco
Subtítulos:        lg, semibold, branco
Labels:            sm, medium, cinza-300
Números:           3xl, bold, cores variadas
```

---

## 6️⃣ RESPONSIVIDADE

### Em Desktop (1920px)
```
┌──────────────────────────────────────────┐
│ [Card1] [Card2] [Card3] [Card4] [Card5]  │
├──────────────────────────────────────────┤
│ [Filtros completos em grid 2 colunas]   │
├──────────────────────────────────────────┤
│ [Tabela com todas as colunas visíveis]  │
└──────────────────────────────────────────┘
```

### Em Tablet (1024px)
```
┌────────────────────────┐
│ [Card1] [Card2] [Card3]│
│ [Card4] [Card5]        │
├────────────────────────┤
│ [Filtros 2 colunas]    │
├────────────────────────┤
│ [Tabela com scroll]    │
└────────────────────────┘
```

### Em Mobile (375px)
```
┌──────────────────┐
│ [Card1]          │
│ [Card2]          │
│ [Card3]          │
│ [Card4]          │
│ [Card5]          │
├──────────────────┤
│ [Filtros 1 col]  │
├──────────────────┤
│ [Tabela scroll→] │
└──────────────────┘
```

---

## 7️⃣ ESTADOS DA PÁGINA

### Estado: Carregando
```
┌────────────────────────────────────────┐
│                                        │
│    ⟳ Carregando boletos...             │
│                                        │
│         [Spinner animado]              │
│                                        │
└────────────────────────────────────────┘
```

### Estado: Erro
```
┌────────────────────────────────────────┐
│  ⚠️ Erro ao carregar dados              │
│  Erro na conexão com servidor           │
│                                        │
│  (Mensagem de erro em vermelho)        │
└────────────────────────────────────────┘
```

### Estado: Vazio
```
┌────────────────────────────────────────┐
│ Boletos Bancários (0 de 0 registros)   │
├────────────────────────────────────────┤
│                                        │
│           ⚠️                           │
│   Nenhum boleto encontrado             │
│   com os filtros aplicados             │
│                                        │
└────────────────────────────────────────┘
```

### Estado: Sucesso (Dados Carregados)
```
✅ Tudo renderiza normalmente
   - Cards com números
   - Filtros funcionando
   - Tabela com dados
   - Botões responsivos
```

---

## 8️⃣ EXEMPLO DE FLUXO COMPLETO

### Cenário: Usuário quer ver boletos pagos

```
1. Usuário acessa: http://localhost:5173
   ↓
2. Faz login
   ↓
3. Clica em "Backoffice Delta" (sidebar)
   ↓
4. Clica em "📋 Licitações (Iizu)" ← NOVO!
   ↓
5. Página carrega:
   - Cards com estatísticas
   - Tabela com 42 boletos
   - Todos os status misturados
   ↓
6. Usuário seleciona status "Pago"
   ↓
7. Tabela filtra automaticamente
   ↓
8. Agora mostra apenas 28 boletos (os que foram pagos)
   ↓
9. Usuário clica "Exportar CSV"
   ↓
10. Arquivo baixa: "licitacoes-2025-10-21.csv"
    Com apenas os 28 boletos pagos
   ↓
11. ✅ Pronto!
```

---

## 9️⃣ NOTIFICAÇÕES (TOASTS)

### Sucesso
```
┌────────────────────────────────────┐
│ ✅ Sucesso                         │
│ Limite PIX atualizado com sucesso  │
│                                    │
│ [Fechar ✕]                        │
└────────────────────────────────────┘
```

### Erro
```
┌────────────────────────────────────┐
│ ❌ Erro                            │
│ Erro ao carregar licitações        │
│                                    │
│ [Fechar ✕]                        │
└────────────────────────────────────┘
```

### Informação
```
┌────────────────────────────────────┐
│ ℹ️ Informação                      │
│ 42 registros exportados             │
│                                    │
│ [Fechar ✕]                        │
└────────────────────────────────────┘
```

---

## 🔟 CONTROLES E BOTÕES

### Botão Atualizar
```
   [↻ Atualizar]
   
   Ao hover:
   - Background fica mais escuro
   - Ícone gira se estiver carregando
   
   Desabilitado (durante carregamento):
   - Cor desativada
   - Cursor não-permitido
```

### Botão Exportar CSV
```
   [⬇ Exportar CSV]
   
   Cores:
   - Background: Laranja (#f97316)
   - Texto: Branco
   
   Ao hover:
   - Background: Laranja mais escuro
   - Ícone de download
   
   Desabilitado (sem dados):
   - Cor cinza
   - Não é clicável
```

### Filtros
```
   [Buscar...]         ← Texto ativo, cursor pisca
   
   [Todos ▼]           ← Dropdown aberto/fechado
   ├─ Todos
   ├─ Pago
   ├─ Aberto
   ├─ Cancelado
   ├─ Expirado
   └─ Atrasado
```

---

## ✨ DETALHES DE UX

### Hover Effects
```
- Cards: Background fica levemente mais claro
- Linhas da tabela: Fundo fica cinza quando passa mouse
- Botões: Mudam cor ao hover
- Links: Decoração de sublinhado
```

### Transições
```
- Todas as cores têm transição de 200ms
- Animações suaves
- Loader gira continuamente
```

### Acessibilidade
```
- Alt text em ícones
- ARIA labels em botões
- Cores com contraste adequado
- Teclado funciona (Tab, Enter)
```

---

## 🎨 RESUMO VISUAL

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                                                    ┃
┃  📋 LICITAÇÕES (IIZU)           [↻] [⬇]           ┃
┃  Gestão e acompanhamento...                        ┃
┃                                                    ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                                    ┃
┃  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐      ┃
┃  │   42   │ │ R$42k  │ │ R$39k  │ │ R$2.1k │      ┃
┃  │Boletos │ │ Total  │ │Líquido │ │ Taxas  │      ┃
┃  └────────┘ └────────┘ └────────┘ └────────┘      ┃
┃                                                    ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                                    ┃
┃  Buscar: [____________]  Status: [Todos ▼]       ┃
┃                                                    ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                                    ┃
┃  Cliente │ Tipo   │ V.Total │ Líquido │ Status    ┃
┃  ────────┼────────┼─────────┼─────────┼───────    ┃
┃  SAAE    │ IIZU   │ R$1.000 │ R$950   │ ✅ Pago   ┃
┃  SAAE    │ IIZU   │ R$2.000 │ R$1.900 │ ✅ Pago   ┃
┃  SAAE    │ IIZU   │ R$1.500 │ R$1.500 │ 🟨 Aberto │
┃  ...     │ ...    │ ...     │ ...     │ ...       ┃
┃                                                    ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

---

**Data**: 21 de Outubro de 2025
**Status**: ✅ Visualização Completa
