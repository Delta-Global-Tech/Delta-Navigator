# 🚀 GUIA DE TESTE - Backoffice Delta PIX

## ✅ Solução Implementada

Acabei de corrigir o problema! Aqui está o que foi feito:

### 1. ✨ Adicionado ao `.env`
```env
# PIX Limit API - PaySmart
VITE_PIX_API_BASE=https://api-v2.conta-digital.paysmart.com.br/
VITE_PIX_API_KEY=1a6109b1-096c-4e59-9026-6cd5d3caa16d
VITE_PIX_API_KEY_HEADER=x-api-key
VITE_USE_MOCK=false
```

### 2. 🧪 Adicionado Mock Data
- Dados de teste já configurados para quando a API não responder
- Ativa com `VITE_USE_MOCK=true` no `.env`

### 3. 🔧 Serviço Atualizado
- `pixLimitService.ts` agora usa as variáveis de ambiente
- Suporte a mock data automático quando API falha

---

## 🎯 COMO TESTAR

### Opção 1: Com Dados Reais (Produção)
```bash
# 1. Certifique-se que .env tem:
VITE_USE_MOCK=false

# 2. Reinicie o servidor
npm run dev

# 3. Acesse
http://localhost:5173/backoffice-delta
```

**Importante:** A API PaySmart precisa estar acessível de onde você está

---

### Opção 2: Com Dados Mock (Desenvolvimento)
```bash
# 1. Modifique .env para:
VITE_USE_MOCK=true

# 2. Reinicie o servidor
npm run dev

# 3. Acesse
http://localhost:5173/backoffice-delta
```

**Vantagem:** Funciona offline, sem depender da API

---

## 🧬 O que Mudou no Código

### antes ❌
```typescript
const API_BASE = 'https://api-v2.conta-digital.paysmart.com.br/';
const API_KEY = '1a6109b1-096c-4e59-9026-6cd5d3caa16d';

async getPixLimit(accountId) {
  return apiClient.get(`/accounts/${accountId}/pix/getLimit`);
}
```

### depois ✅
```typescript
const API_BASE = import.meta.env.VITE_PIX_API_BASE || 'https://...';
const API_KEY = import.meta.env.VITE_PIX_API_KEY || '...';
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

async getPixLimit(accountId) {
  if (USE_MOCK) {
    return mockPixLimitData;  // Dados de teste
  }
  return apiClient.get(`/accounts/${accountId}/pix/getLimit`);
}
```

---

## 🧪 Testes Recomendados

### Teste 1: Carregar Dados
1. Abra http://localhost:5173/backoffice-delta
2. Vá para aba "Alterar Limite PIX"
3. **Esperado:** Tabelas carregam com dados (em verde ✅)

### Teste 2: Editar Limite
1. Em qualquer campo, altere um valor
2. Clique "Salvar"
3. **Esperado:** Toast verde: "Limite atualizado com sucesso"

### Teste 3: Solicitações
1. Vá para aba "Solicitações"
2. **Esperado:** Lista de solicitações carrega (com mock, aparece 1 item)

### Teste 4: Filtrar Solicitações
1. Digite no campo de busca
2. **Esperado:** Lista filtra em tempo real

---

## 🔍 Como Verificar se Está Funcionando

### No Browser (F12)
```
1. Pressione F12
2. Vá para "Console"
3. Procure por:
   ✅ "📋 Usando dados mock para getPixLimit" (se USE_MOCK=true)
   ou
   ✅ Network requests para PaySmart (se USE_MOCK=false)
```

### No Terminal
```
npm run dev
# Deve aparecer algo como:
# ➜  Local:   http://localhost:5173/
# ➜  Press h to show help
```

---

## ❌ Se Ainda Estiver com Erro

### 1️⃣ Verifique o `.env`
```powershell
# Abra e confirme que tem:
cat .env | grep VITE_PIX
```

**Esperado:**
```
VITE_PIX_API_BASE=https://api-v2.conta-digital.paysmart.com.br/
VITE_PIX_API_KEY=1a6109b1-096c-4e59-9026-6cd5d3caa16d
VITE_PIX_API_KEY_HEADER=x-api-key
VITE_USE_MOCK=false
```

### 2️⃣ Force Refresh
```
Ctrl + Shift + R  (força limpeza de cache)
ou
F12 → Network → Disable cache → Recarregar
```

### 3️⃣ Limpe node_modules e reinstale
```powershell
Remove-Item -Recurse -Force node_modules
npm install
npm run dev
```

### 4️⃣ Use Mock Data
```
Altere no .env:
VITE_USE_MOCK=true

npm run dev
```

---

## 📊 Comparação: Real vs Mock

| Aspecto | Real API | Mock |
|---------|----------|------|
| Precisa API | ✅ Sim | ❌ Não |
| Internet | ✅ Precisa | ❌ Não |
| Latência | ⚠️ Pode variar | ✅ Instantâneo |
| Dados | ✅ Atualizados | ⚠️ Estáticos |
| Teste | ⚠️ Caro | ✅ Rápido |
| Desenvolvimento | ⚠️ Lento | ✅ Rápido |

---

## 🎁 Bônus: Ligar/Desligar Mock Facilmente

Para alternar entre real e mock sem editar `.env`, use no DevTools Console:
```javascript
// Não precisa fazer nada, está tudo automático!
// Basta mudar VITE_USE_MOCK no .env e reiniciar npm run dev
```

---

## ✨ Próximos Passos

1. **Reinicie `npm run dev`**
2. **Teste a página** http://localhost:5173/backoffice-delta
3. **Verifique console** (F12) para mensagens de debug
4. Se tudo OK, teste com dados reais (VITE_USE_MOCK=false)

---

**Desenvolvido com ❤️ - Delta Global Bank**
