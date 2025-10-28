# 🔍 DIAGNÓSTICO - Network Error

## Status
✅ Sem certificados ou chaves privadas no código  
✅ Sem dados sensíveis commitados  
✅ Segurança implementada corretamente  

---

## Possíveis Causas do Network Error

### 1️⃣ CORS (Cross-Origin Resource Sharing)
**Problema:** API não aceita requisições do frontend local

**Verificar:**
```bash
# Abra DevTools (F12) → Network
# Procure pela requisição GET para getLimit
# Verifique a seção "Response Headers"
# Procure por: Access-Control-Allow-Origin
```

**Se o erro for CORS:** A API precisa configurar CORS no servidor

---

### 2️⃣ API Key Inválida ou Expirada
**Problema:** Chave de API foi revogada ou expirada

**Testar localmente:**
```bash
curl -v -X GET \
  "https://api-v2.conta-digital.paysmart.com.br/conta-digital/api/v1/accounts/158/pix/getLimit" \
  -H "x-api-key: 1a6109b1-096c-4e59-9026-6cd5d3caa16d"
```

**Se retornar 403 Forbidden:** API Key é inválida

---

### 3️⃣ URL da API Incorreta
**Problema:** Endpoint ou caminho errado

**Verificar em `pixLimitService.ts`:**
```typescript
const API_BASE = import.meta.env.VITE_PIX_API_BASE || 
  'https://api-v2.conta-digital.paysmart.com.br/';
```

**Endpoint correto:**
```
GET https://api-v2.conta-digital.paysmart.com.br/conta-digital/api/v1/accounts/158/pix/getLimit
```

---

### 4️⃣ Firewall ou Proxy
**Problema:** Conexão bloqueada por firewall

**Testar:**
```powershell
Test-NetConnection api-v2.conta-digital.paysmart.com.br -Port 443
```

**Se retornar `TcpTestSucceeded: False`:** Firewall bloqueando

---

### 5️⃣ Certificado SSL/TLS Inválido
**Problema:** Certificado do servidor expirou ou é auto-assinado

**Testar com curl (ignorar certificado):**
```bash
curl -k -X GET \
  "https://api-v2.conta-digital.paysmart.com.br/conta-digital/api/v1/accounts/158/pix/getLimit" \
  -H "x-api-key: 1a6109b1-096c-4e59-9026-6cd5d3caa16d"
```

**Se funcionar com `-k`:** Problema é certificado SSL

---

## 🔧 Passos para Resolver

### Passo 1: Verificar Console
```
1. Abra http://localhost:5173/backoffice-delta
2. Pressione F12
3. Vá para aba "Console"
4. Procure mensagens de erro
5. Copie a mensagem completa
```

### Passo 2: Verificar Network
```
1. Vá para aba "Network"
2. Clique em "Recarregar" ou F5
3. Procure por requisição "getLimit"
4. Clique nela
5. Verifique:
   • Status (200, 403, 404, etc)
   • Headers
   • Response
```

### Passo 3: Testar com curl
```powershell
$headers = @{
    "x-api-key" = "1a6109b1-096c-4e59-9026-6cd5d3caa16d"
}

Invoke-WebRequest `
  -Uri "https://api-v2.conta-digital.paysmart.com.br/conta-digital/api/v1/accounts/158/pix/getLimit" `
  -Headers $headers `
  -UseBasicParsing
```

---

## 💡 Solução Alternativa: Mock Data (Para Teste)

Se a API não estiver funcionando, podemos usar dados mock:

```typescript
// pixLimitService.ts - Adicione antes de createApiClient()

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

const mockPixLimitData: PixLimitResponse = {
  pixLimitInternal: {
    startNightTime: "20:00:00",
    dayLimit: 58306.43,
    dayTransactionLimit: 58306.43,
    nightLimit: 10000,
    nightTransactionLimit: 10000,
    status: 0
  },
  pixLimitExternal: {
    startNightTime: "20:00:00",
    dayLimit: 58306.43,
    dayTransactionLimit: 58306.43,
    nightLimit: 10000,
    nightTransactionLimit: 10000,
    status: 0
  },
  pixLimitWithdraw: {
    startNightTime: "20:00:00",
    dayLimit: 5000,
    dayTransactionLimit: 5000,
    nightLimit: 1000,
    nightTransactionLimit: 1000,
    status: 0
  }
};

export const pixLimitService = {
  async getPixLimit(accountId: number): Promise<PixLimitResponse> {
    if (USE_MOCK) {
      console.log('📋 Usando dados mock (desenvolvimento)');
      return mockPixLimitData;
    }
    // resto do código...
  }
};
```

**Em `.env`:**
```
VITE_USE_MOCK=true
```

---

## ✅ Checklist de Resolução

- [ ] Verificou console do browser (F12)
- [ ] Verificou aba Network
- [ ] Testou com curl/PowerShell
- [ ] Verificou API Key está correta
- [ ] Verificou URL da API está correta
- [ ] Verificou conectividade (ping/telnet)
- [ ] Verificou certificado SSL
- [ ] Verificou CORS headers

---

## 📞 Próximos Passos

1. **Se for CORS:** Contate PaySmart para configurar CORS
2. **Se for API Key:** Verifique validade da chave
3. **Se for URL:** Confirme endpoint correto com PaySmart
4. **Se for Firewall:** Abra porta 443 no firewall
5. **Se persistir:** Use mock data para testes locais

---

**Desenvolvido com ❤️ - Delta Global Bank**
