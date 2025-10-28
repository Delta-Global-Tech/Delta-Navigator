# Análise de Padrões de Produtos - Backend `em.a_desembolsar`

## Estrutura de Retorno do Backend

O backend retorna a seguinte estrutura:
```json
{
  "dados": [
    {
      "cpf_cnpj": "...",
      "cliente": "...",
      "dt_da_p1": "...",
      "carteira": "...",
      "produto": "COMPRA DE DÍVIDA - Joinville (1,29% a 2,04%)",
      "contrato": "...",
      "vlr_solic": 1500.00,
      "vlr_liberado": 750.50,
      "rmn_pl": "...",
      "dt_liberacao": "...",
      "vlr_contrato": "...",
      "vlr_pl": "...",
      "rmn_agencia": "...",
      "dk_carteira": "...",
      "dk_produto": "...",
      "cdk_client": "...",
      "rmn_inst": "...",
      "loaded_at": "..."
    }
  ],
  "estatisticas": {
    "total_registros": 777,
    "total_solicitado": 50000000.00,
    "total_liberado": 35000000.00,
    "percentual_liberacao": 70.00,
    "empenhos_liberados": 600,
    "empenhos_pendentes": 150,
    "empenhos_parciais": 27,
    "produtos_unicos": 45,
    "carteiras_unicas": 8,
    "colunas": [...]
  },
  "sucesso": true
}
```

## Padrões Identificados no Campo `produto`

### Estrutura Geral:
```
[CATEGORIA] - [CIDADE/REGIÃO] ([TAXA%])
```

Exemplos que precisam ser padronizados:

| Produto Original | Categoria Final |
|---|---|
| `COMPRA DE DÍVIDA - Joinville (1,29% a 2,04%)` | `COMPRA DE DÍVIDA` |
| `COMPRA DE DÍVIDA - Belo Horizonte (1,50% a 2,00%)` | `COMPRA DE DÍVIDA` |
| `COMPRA DE DÍVIDA - São Paulo SP (1,29%)` | `COMPRA DE DÍVIDA` |
| `FGTS - Rio de Janeiro (0,99% a 1,50%)` | `FGTS` |
| `FGTS - S/ Seguro` | `FGTS` |
| `FGTS - Com Seguro` | `FGTS` |
| `CRÉDITO PESSOAL - Curitiba PR (2,00% a 3,00%)` | `CRÉDITO PESSOAL` |
| `CRÉDITO RURAL - Brasília DF (0,75%)` | `CRÉDITO RURAL` |

## Regras de Padronização

### 1. **Remover Percentuais (PRIORIDADE 1)**
- Padrão: `\d+,\d+%` (ex: 1,29%, 2,04%)
- Padrão: `X% a Y%` (ex: 1,29% a 2,04%)
- Regex: `/\s*\d+,\d+%.*$/g` - Remove tudo depois do primeiro %
- Regex: `/\s*\(\s*\d+,\d+%\s*\)/g` - Remove (X%) patterns

### 2. **Remover Modificadores de Seguro (PRIORIDADE 2)**
- Padrão: `S/ Seguro` (sem seguro)
- Padrão: `Com Seguro` (com seguro)
- Regex: `/\s+(S\/|Com)\s+(Seguro|seguro)/gi`

### 3. **Remover Cidades/Localizações (PRIORIDADE 3)**
- Padrão: Nome da Cidade ou Sigla do Estado
- Lista deve incluir: Nomes de cidades + Siglas de estados
- Regex: `/\b{CIDADE}\b/gi` (word boundary para não afetar palavras parciais)

### 4. **Limpeza Final (PRIORIDADE 4)**
- Remover hyphens/dashes extras: `/\s*[-–]\s*/g` → espaço
- Trim e normalizar espaços: `.trim()` + `/\s+/g` → espaço simples

## Implementação Otimizada

```typescript
const extrairCategoriaProduto = (produto: string): string => {
  if (!produto?.trim()) return 'Sem Produto';
  
  // Lista completa de cidades e estados brasileiros
  const cidadesEstados = [
    // Estados (siglas)
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
    
    // Capitais principais
    'Aracaju', 'Belém', 'Belo Horizonte', 'Boa Vista', 'Brasília',
    'Campo Grande', 'Cuiabá', 'Curitiba', 'Fortaleza', 'Goiânia',
    'João Pessoa', 'Maceió', 'Macapá', 'Manaus', 'Natal',
    'Palmas', 'Porto Alegre', 'Recife', 'Rio Branco', 'Rio de Janeiro',
    'Salvador', 'São Luís', 'São Paulo', 'Teresina',
    
    // Grandes cidades
    'Campinas', 'Contagem', 'Divinópolis', 'Duque de Caxias',
    'Diadema', 'Guarulhos', 'Joinville', 'Jundiaí', 'Juiz de Fora',
    'Londrina', 'Mossoró', 'Osasco', 'Piracicaba', 'Ribeirão Preto',
    'Santo André', 'Santos', 'São Bernardo do Campo', 'São Gonçalo',
    'Sorocaba', 'Uberlândia', 'Vitória'
  ];
  
  let categoria = produto.trim();
  
  // PRIORIDADE 1: Remove percentuais (mais importante!)
  categoria = categoria
    .replace(/\s*\d+,\d+%.*$/g, '')         // "1,29% a 2,04%"
    .replace(/\s*\(\s*\d+,\d+%\s*\)/g, '')  // "(1,50%)"
    .replace(/\s+%/g, '');                  // "%" solto
  
  // PRIORIDADE 2: Remove modificadores de seguro
  categoria = categoria.replace(/\s+(S\/|Com)\s+(Seguro|seguro)/gi, '');
  
  // PRIORIDADE 3: Remove cidades/estados
  cidadesEstados.forEach(local => {
    const regex = new RegExp(`\\b${local}\\b`, 'gi');
    categoria = categoria.replace(regex, '');
  });
  
  // PRIORIDADE 4: Limpeza final
  categoria = categoria
    .replace(/\s*[-–—]\s*/g, ' ')    // Hyphens → espaço
    .replace(/[\[\(\{]\s*[\]\)\}]/g, '')  // Parênteses vazios
    .trim()
    .replace(/\s+/g, ' ');           // Espaços múltiplos → um espaço
  
  return categoria || 'Sem Categoria';
};
```

## Casos de Teste

```typescript
const testCases = [
  // Input → Expected Output
  ['COMPRA DE DÍVIDA - Joinville (1,29% a 2,04%)', 'COMPRA DE DÍVIDA'],
  ['COMPRA DE DÍVIDA - Belo Horizonte (1,50%)', 'COMPRA DE DÍVIDA'],
  ['FGTS - S/ Seguro', 'FGTS'],
  ['FGTS - Com Seguro', 'FGTS'],
  ['CRÉDITO PESSOAL - São Paulo SP (2,00%)', 'CRÉDITO PESSOAL'],
  ['CRÉDITO RURAL - Brasília - DF (0,75% a 1,00%)', 'CRÉDITO RURAL'],
  ['CRÉDITO IMOBILIÁRIO', 'CRÉDITO IMOBILIÁRIO'],
  ['Empréstimo Consignado - Rio de Janeiro RJ', 'Empréstimo Consignado'],
  ['', 'Sem Categoria'],
  [null, 'Sem Categoria'],
];
```

## Impacto nos Gráficos

Após a padronização:
- **Antes:** 45 produtos únicos (muitos duplicados por cidade/taxa)
- **Depois:** ~8-12 categorias principais (COMPRA DE DÍVIDA, FGTS, CRÉDITO PESSOAL, etc)
- **Benefício:** Gráficos muito mais legíveis e agregação correta dos valores

## Próximos Passos

1. ✅ Implementar função `extrairCategoriaProduto()` com regras de prioridade
2. ✅ Testar com dados reais
3. ✅ Aplicar na agregação `produtosData` useMemo
4. ✅ Validar nos gráficos de quantidade e valores
5. Opcional: Replicar lógica no backend para melhor performance
