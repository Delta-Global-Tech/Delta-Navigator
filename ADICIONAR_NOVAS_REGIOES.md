# 🚀 Como Adicionar Novas Regiões

Quando você tiver mais pastas com dados (ex: São Paulo, Brasília, Rio de Janeiro), siga este guia para adicionar à tela.

---

## 📋 Estrutura Esperada

Seus arquivos devem estar em:
```
C:\Users\alexsandro.costa\Documents\BATE_EM_AVERBADORA\
├── BH\
│   └── comparativo_bh.xlsx
├── POÁ\
│   └── comparativo_poa.xlsx
├── NOVA_REGIAO\           ← Adicione aqui
│   └── comparativo_nova.xlsx
└── ...
```

---

## 🛠️ Passo 1: Preparar o Script Python

Crie ou atualize o arquivo `export_to_json.py`:

```python
import pandas as pd
import json
import os

# Diretório onde salvar os JSONs
data_dir = r'C:\Users\alexsandro.costa\Delta-Navigator\src\data\averbadora'
os.makedirs(data_dir, exist_ok=True)

# =====================================================
# DADOS EXISTENTES (não remover)
# =====================================================

# BH Data
df_bh = pd.read_excel(r'C:\Users\alexsandro.costa\Documents\BATE_EM_AVERBADORA\BH\comparativo_bh.xlsx')
df_bh['Data_Entrada'] = pd.to_datetime(df_bh['Data_Entrada'], format='%d/%m/%Y').dt.strftime('%Y-%m-%d')
bh_data = df_bh.to_dict(orient='records')

with open(os.path.join(data_dir, 'bh.json'), 'w', encoding='utf-8') as f:
    json.dump(bh_data, f, ensure_ascii=False, indent=2)

print(f"✓ BH data saved: {len(bh_data)} records")

# POÁ Data
df_poa = pd.read_excel(r'C:\Users\alexsandro.costa\Documents\BATE_EM_AVERBADORA\POÁ\comparativo_poa.xlsx')
df_poa['Data_Entrada'] = pd.to_datetime(df_poa['Data_Entrada'], format='%d/%m/%Y').dt.strftime('%Y-%m-%d')
poa_data = df_poa.to_dict(orient='records')

with open(os.path.join(data_dir, 'poa.json'), 'w', encoding='utf-8') as f:
    json.dump(poa_data, f, ensure_ascii=False, indent=2)

print(f"✓ POÁ data saved: {len(poa_data)} records")

# =====================================================
# NOVA REGIÃO - Adicione aqui
# =====================================================

# SÃO PAULO Data
df_sp = pd.read_excel(r'C:\Users\alexsandro.costa\Documents\BATE_EM_AVERBADORA\SÃO_PAULO\comparativo_sp.xlsx')
df_sp['Data_Entrada'] = pd.to_datetime(df_sp['Data_Entrada'], format='%d/%m/%Y').dt.strftime('%Y-%m-%d')
sp_data = df_sp.to_dict(orient='records')

with open(os.path.join(data_dir, 'sp.json'), 'w', encoding='utf-8') as f:
    json.dump(sp_data, f, ensure_ascii=False, indent=2)

print(f"✓ SP data saved: {len(sp_data)} records")

# =====================================================
# MANUTENÇÃO: Todos os dados combinados
# =====================================================

combined_data = bh_data + poa_data + sp_data  # ← Adicionar + sp_data
with open(os.path.join(data_dir, 'all.json'), 'w', encoding='utf-8') as f:
    json.dump(combined_data, f, ensure_ascii=False, indent=2)

print(f"✓ Combined data saved: {len(combined_data)} records")

# =====================================================
# ÍNDICE DE REGIÕES
# =====================================================

regions = {
    'BH': {
        'name': 'Belo Horizonte',
        'records': len(bh_data),
        'matches': len(df_bh[df_bh['STATUS'] == 'MATCH']),
        'path': 'bh.json'
    },
    'POA': {
        'name': 'Porto Alegre',
        'records': len(poa_data),
        'matches': len(df_poa[df_poa['STATUS'] == 'MATCH']),
        'path': 'poa.json'
    },
    'SP': {
        'name': 'São Paulo',
        'records': len(sp_data),
        'matches': len(df_sp[df_sp['STATUS'] == 'MATCH']),
        'path': 'sp.json'
    }
}

with open(os.path.join(data_dir, 'regions.json'), 'w', encoding='utf-8') as f:
    json.dump(regions, f, ensure_ascii=False, indent=2)

print(f"✓ Regions index saved")

# Relatório final
print("\n" + "="*50)
print("DATA SUMMARY")
print("="*50)
for region_code, region_info in regions.items():
    print(f"✓ {region_info['name']:20} {region_info['records']:3} registros ({region_info['matches']:2} matches)")
print(f"\nTotal Geral: {len(combined_data)} registros")
print("="*50)
```

---

## 🛠️ Passo 2: Executar Script

```powershell
# No VS Code terminal (PowerShell)
& 'C:\Users\alexsandro.costa\Delta-Navigator\.venv\Scripts\python.exe' export_to_json.py
```

**Saída esperada**:
```
✓ BH data saved: 84 records
✓ POÁ data saved: 61 records
✓ SP data saved: XXXX records
✓ Combined data saved: XXXX records
✓ Regions index saved

==================================================
DATA SUMMARY
==================================================
✓ Belo Horizonte     84 registros (52 matches)
✓ Porto Alegre      61 registros (30 matches)
✓ São Paulo         XX registros (XX matches)

Total Geral: XXX registros
==================================================
```

---

## 🛠️ Passo 3: Atualizar MatchAverbadora.tsx

Abra `src/pages/MatchAverbadora.tsx` e:

### 3.1 Adicionar imports

```typescript
// Dados importados
import bhData from '@/data/averbadora/bh.json';
import poaData from '@/data/averbadora/poa.json';
import spData from '@/data/averbadora/sp.json';  // ← NOVO
import allData from '@/data/averbadora/all.json';
import regionsData from '@/data/averbadora/regions.json';
```

### 3.2 Adicionar ao tipo

```typescript
type RegionKey = keyof typeof regionsData;
```

### 3.3 Adicionar ao getData()

Procure a função `getData` e atualize:

```typescript
const getData = (region: string): MatchRecord[] => {
  switch (region) {
    case 'BH':
      return bhData as MatchRecord[];
    case 'POA':
      return poaData as MatchRecord[];
    case 'SP':              // ← NOVO
      return spData as MatchRecord[];  // ← NOVO
    default:
      return bhData as MatchRecord[];
  }
};
```

### 3.4 Adicionar aba no TabsList

Procure `<TabsList>` e atualize:

```tsx
<TabsList className="grid w-full max-w-md grid-cols-4">
  <TabsTrigger value="overview">Geral</TabsTrigger>
  <TabsTrigger value="bh">BH</TabsTrigger>
  <TabsTrigger value="poa">POÁ</TabsTrigger>
  <TabsTrigger value="sp">SP</TabsTrigger>  {/* ← NOVO */}
  <TabsTrigger value="compare">Comparar</TabsTrigger>
</TabsList>
```

### 3.5 Adicionar TabsContent para nova região

Copie o bloco `<TabsContent value="poa" ...>` e adapte:

```tsx
{['BH', 'POA', 'SP'].map((region) => (  {/* ← Adicione 'SP' aqui */}
  <TabsContent
    key={region}
    value={region.toLowerCase()}
    className="space-y-6"
  >
    {/* ... conteúdo igual para as 3 regiões ... */}
  </TabsContent>
))}
```

---

## 🎨 Passo 4 (Opcional): Atualizar Sidebar

Se quiser que cada região tenha um item no sidebar:

### 4.1 Abrir `src/components/layout/Sidebar.tsx`

### 4.2 Adicionar ao array

```typescript
const averbadoraItems: NavItem[] = [
  {
    title: "Match Averbadora",
    url: "/match-averbadora",
    icon: GitCompare,
    description: "Análise de Matches por Região",
    emoji: "🔗"
  },
  {
    title: "SP Detalhado",  // ← NOVO (opcional)
    url: "/match-averbadora#sp",
    icon: GitCompare,
    description: "São Paulo",
    emoji: "🗺️"
  }
];
```

---

## 📝 Template Rápido para Nova Região

Se seguir este template, é bem rápido:

```python
# Copie e adapte isto para cada nova região:

# NOME_REGION Data
df_regiao = pd.read_excel(r'C:\Users\alexsandro.costa\Documents\BATE_EM_AVERBADORA\NOME_REGIAO\comparativo_regiao.xlsx')
df_regiao['Data_Entrada'] = pd.to_datetime(df_regiao['Data_Entrada'], format='%d/%m/%Y').dt.strftime('%Y-%m-%d')
regiao_data = df_regiao.to_dict(orient='records')

with open(os.path.join(data_dir, 'regiao.json'), 'w', encoding='utf-8') as f:
    json.dump(regiao_data, f, ensure_ascii=False, indent=2)

print(f"✓ NOME_REGIAO data saved: {len(regiao_data)} records")

# No regions.json:
'SIGLA': {
    'name': 'Nome Completo',
    'records': len(regiao_data),
    'matches': len(df_regiao[df_regiao['STATUS'] == 'MATCH']),
    'path': 'regiao.json'
}
```

---

## 🔍 Verificação

Após fazer as mudanças:

1. **Salve todos os arquivos**
2. **No navegador**: Abra a página `/match-averbadora`
3. **Verifique**: A nova aba deve aparecer
4. **Teste**: Clique na aba e veja se os dados carregam

---

## ⚠️ Troubleshooting

### Erro: "JSON file not found"
- ✅ Verifique se o script Python executou corretamente
- ✅ Confirme que os arquivos .json estão em `src/data/averbadora/`

### Aba não aparece
- ✅ Verificar se addicionou ao `TabsList`
- ✅ Verificar se addicionou ao `getData()`
- ✅ Verificar se addicionou ao import

### Dados não aparecem
- ✅ Verificar o console do navegador para erros
- ✅ Verificar se o JSON está bem formatado

---

## 💡 Dicas

1. **Mantenha a estrutura das colunas**: BH e POÁ têm as mesmas colunas, novas regiões devem ter também
2. **Nomes consistentes**: Use `comparativo_regiao.xlsx` como padrão
3. **Backup**: Antes de atualizar, faça backup de `regions.json` e `all.json`
4. **Teste incremental**: Adicione uma região por vez

---

## 📚 Exemplo: Adicionando São Paulo

**Estrutura**:
```
Documents/BATE_EM_AVERBADORA/SÃO_PAULO/
└── comparativo_sp.xlsx
```

**Script atualizado**: Veja template acima com "SP"

**MatchAverbadora.tsx**:
```tsx
import spData from '@/data/averbadora/sp.json';

case 'SP':
  return spData as MatchRecord[];

<TabsTrigger value="sp">SP</TabsTrigger>

{['BH', 'POA', 'SP'].map((region) => ( ... ))}
```

**Resultado**: Nova aba "SP" com 100% dos dados carregados ✅

---

**Pronto!** Qualquer dúvida, revise este guia.
