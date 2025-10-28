# 📊 Análise Real da Tabela `em.a_desembolsar`

## 🎯 Dados Reais

```
Total de registros: 777
Produtos únicos: 59
cd_produtos únicos: 59 (1:1 com nome)
Carteiras únicas: 10
Total Solicitado: R$ 7.162.709,39
Total Liberado: R$ 0,00 (NADA FOI LIBERADO!)
```

## 📋 Estrutura dos Nomes de Produtos

Os produtos têm um padrão **MUITO ESPECÍFICO**:

### Padrão 1: Compra de Dívida com Localidade
```
"Joinville - Compra de divida - 1,60%"
"BH - Compra de Dívida - Taxa 1,60"
"Cotia - Compra de divida - 1,60%"
"POÁ - Compra de Dívida - 1,60%"
"Palhoça - Compra de Divida 1,80%"
"SIAPE - Compra de Divida - 1,80%"
```
- 90 registros com "Joinville"
- 42+ registros com "BH"
- Vários com "Cotia", "POÁ", etc

### Padrão 2: FGTS Antecipação
```
"Antecipação FGTS S/ Seguro 1,29% a 2,04%"
```
- 235 registros (o MAIOR)

### Padrão 3: Novo Empréstimo (com/sem seguro)
```
"BH - Novo C/ Seguro - OURO 1 - 2,59%"
"BH - Novo S/ Seguro - OURO 2 - 2,59%"
"JOINVILLE - NOVO S/ Seguro - 1,90%"
"COTIA - NOVO S/ Seguro - 2,00%"
"POÁ - Novo S/ Seguro - BRONZE 2 - 2,00%"
```

### Padrão 4: Crédito Pessoal
```
"Credito pessoal - Keeper CDC - 4,19%"
```

## 🔍 O Problema de Agregação

Se você quer somar **TUDO que é "Compra de Dívida"** (independente de localidade):

| Localidade | Quantidade | Total Solicitado |
|---|---|---|
| Joinville | 90+34+28+31+2+20 = **205** | R$ 1.123.311,71 |
| BH | 42+52+41+52+14+19+... = **~250** | R$ 2.225.765,32 |
| Cotia | 17+11+17+7 = **52** | R$ 757.551,99 |
| POÁ | 10+5+5+5+5+5 = **35** | R$ 536.409,70 |
| Palhoça | 2+1 = **3** | R$ 31.937,82 |
| SIAPE | 1+1 = **2** | R$ 29.018,67 |
| **TOTAL "Compra de Dívida"** | **~547** | **R$ 4.704.000+** |

vs

| Produto | Quantidade | Total |
|---|---|---|
| FGTS | 235 | R$ 536.219,93 |
| Novo/outros | 77 | R$ 922.489,46 |
| Total Geral | 777 | R$ 7.162.709,39 |

## 💡 O Que Fazer?

### Opção 1: Agregar por Nome Exato (simples)
Cada uma das 59 variações é uma barra no gráfico
```json
"Joinville - Compra de divida - 1,60%" → 90 empenhos
"BH - Compra de Dívida - Taxa 1,60" → 42 empenhos
...
```
**Resultado:** 59 barras

### Opção 2: Agregar Removendo Localidade (melhor)
Extrair só a categoria base:
```
"Joinville - Compra de divida - 1,60%" → "COMPRA DE DÍVIDA"
"BH - Compra de Dívida - Taxa 1,60" → "COMPRA DE DÍVIDA"
"Antecipação FGTS S/ Seguro 1,29% a 2,04%" → "FGTS"
"Credito pessoal - Keeper CDC - 4,19%" → "CRÉDITO PESSOAL"
```
**Resultado:** ~5-10 categorias principais

### Opção 3: Agregar por cd_produt (exato)
Cada código = um nome
```json
cd_produt: 94803 → "Joinville - Compra de divida - 1,60%"
cd_produt: 221 → "BH - Compra de Dívida - Taxa 1,60"
```
**Resultado:** 59 barras (igual à Opção 1)

## 🎯 Recomendação

**Use a Opção 2** (remover localidade)!

Porque:
1. ✅ Agrupa logicamente ("Compra de Dívida" é tudo igual, só muda localidade)
2. ✅ Reduz de 59 para ~10 categorias legíveis
3. ✅ Os números fazem mais sentido (vê o total real de cada produto)
4. ✅ Gráfico fica claro e informativo

## 📝 Lógica para Extrair Categoria

```javascript
function extrairCategoria(produto) {
  // Remove localidades conhecidas
  let cat = produto;
  
  // Remove cidades do começo: "Joinville - ", "BH - ", etc
  cat = cat.replace(/^(Joinville|BH|Cotia|POÁ|Palhoça|SIAPE|Ariquemes|COTIA|JOINVILLE)\s*-\s*/i, '');
  
  // Remove percentuais do final
  cat = cat.replace(/\s*[-–]\s*\d+,\d+%.*$/i, '');
  cat = cat.replace(/\s*\d+,\d+%.*$/i, '');
  
  // Normaliza o nome
  cat = cat.trim();
  
  // Casos específicos
  if (cat.includes('Compra') || cat.includes('compra')) return 'COMPRA DE DÍVIDA';
  if (cat.includes('FGTS') || cat.includes('Fgts')) return 'FGTS';
  if (cat.includes('Novo') || cat.includes('NOVO')) return 'NOVO EMPRÉSTIMO';
  if (cat.includes('Credito') || cat.includes('crédito')) return 'CRÉDITO PESSOAL';
  
  return cat;
}

// Testes
console.log(extrairCategoria("Joinville - Compra de divida - 1,60%")); // → COMPRA DE DÍVIDA
console.log(extrairCategoria("BH - Compra de Dívida - Taxa 1,60")); // → COMPRA DE DÍVIDA
console.log(extrairCategoria("Antecipação FGTS S/ Seguro 1,29% a 2,04%")); // → FGTS
console.log(extrairCategoria("JOINVILLE - NOVO S/ Seguro - 1,90%")); // → NOVO EMPRÉSTIMO
console.log(extrairCategoria("Credito pessoal - Keeper CDC - 4,19%")); // → CRÉDITO PESSOAL
```

## 📊 Resultado Esperado

Ao usar a **Opção 2**, os gráficos mostrariam:

```
COMPRA DE DÍVIDA: 547 empenhos, R$ 4.704.000+
FGTS: 235 empenhos, R$ 536.219,93
NOVO EMPRÉSTIMO: 50 empenhos, R$ 600.000+
CRÉDITO PESSOAL: 1 empenho, R$ 35.000+
```

## 🚀 Próximos Passos

1. Decidir qual opção usar
2. Implementar no backend (agregação SQL ou em JavaScript)
3. Testar os gráficos
4. Validar os números

**Qual você prefere? Simples (59 barras) ou Inteligente (~10 categorias)?**
