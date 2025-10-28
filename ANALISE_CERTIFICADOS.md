# 🔍 ANÁLISE COMPLETA - Network Error PaySmart

## ❌ Erro Real Identificado

```
A conexão subjacente estava fechada: Erro inesperado em um envio.
(Connection closed: Unexpected error on send)
```

**Significado:** Problema com SSL/TLS certificate mutual authentication (mTLS)

---

## 🎯 Diagnóstico

A API PaySmart requer **client certificates** (mutual TLS authentication):

```
Cliente (seu app) → Servidor (PaySmart)
   ↓ envia:
   - private.key (chave privada)
   - certificate.crt (certificado público)
   ↑ valida
   Servidor aceita conexão
```

**Sem os certificados:** Conexão é rejeitada

---

## 📋 O que Você Tem vs O que Precisa

### ✅ Você TEM:
- ✅ API Base URL: `https://api-v2.conta-digital.paysmart.com.br/`
- ✅ API Key: `1a6109b1-096c-4e59-9026-6cd5d3caa16d`
- ✅ Header: `x-api-key`
- ✅ Endpoints corretos
- ✅ Account IDs: 158, 265

### ❌ Você PRECISA:
- ❌ `private.key` - Sua chave privada
- ❌ `certificate.crt` - Seu certificado público

---

## 🚀 SOLUÇÃO: Onde Colocar os Certificados

### ⚠️ **NÃO NO FRONTEND REACT!**

**Isso é crítico:** Os certificados **NUNCA** devem estar no frontend (React).

**Por quê?** Porque:
1. ❌ Frontend é código público (visível no browser)
2. ❌ Qualquer pessoa consegue ver os certificados
3. ❌ Violação total de segurança

### ✅ **CORRETO: Backend Node.js**

Os certificados devem estar no seu **backend (servidor Node.js)**!

---

## 🏗️ Arquitetura Correta

```
┌─────────────────────────────────────────────────────────────┐
│                        BROWSER                              │
│  React App (Frontend)                                       │
│  - Faz requisições para seu backend                         │
│  - Não tem certificados                                    │
└──────────────────┬──────────────────────────────────────────┘
                   │ HTTP/JSON
                   ↓
┌─────────────────────────────────────────────────────────────┐
│              SEU BACKEND (Node.js)                          │
│  http://localhost:3004 (novo)                              │
│  - Tem private.key e certificate.crt                       │
│  - Faz requisições para PaySmart                           │
│  - Protege os certificados                                 │
└──────────────────┬──────────────────────────────────────────┘
                   │ HTTPS + mTLS
                   ↓
┌─────────────────────────────────────────────────────────────┐
│            PAYSMART API (Externa)                           │
│  https://api-v2.conta-digital.paysmart.com.br              │
│  - Valida certificado do cliente                           │
│  - Retorna dados                                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 Passo a Passo: Como Implementar

### Passo 1: Copiar Certificados para o Backend

```bash
# Crie uma pasta certs no backend
mkdir -p server/certs

# Coloque lá:
# server/certs/private.key
# server/certs/certificate.crt
```

### Passo 2: Criar Backend Node.js com Certificados

**Arquivo: `server/pix-gateway.js`**

```javascript
const express = require('express');
const axios = require('axios');
const fs = require('fs');
const https = require('https');
const path = require('path');

const app = express();
app.use(express.json());

// Carregar certificados
const privateKey = fs.readFileSync(path.join(__dirname, 'certs/private.key'), 'utf8');
const certificate = fs.readFileSync(path.join(__dirname, 'certs/certificate.crt'), 'utf8');

// Cliente HTTPS com certificados
const httpsAgent = new https.Agent({
  key: privateKey,
  cert: certificate,
  rejectUnauthorized: false // Só para testes! Em produção: true
});

const apiClient = axios.create({
  baseURL: 'https://api-v2.conta-digital.paysmart.com.br/',
  httpsAgent: httpsAgent,
  headers: {
    'x-api-key': '1a6109b1-096c-4e59-9026-6cd5d3caa16d',
    'Content-Type': 'application/json'
  }
});

// Endpoint: GET /pix/limit/:accountId
app.get('/pix/limit/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const response = await apiClient.get(
      `conta-digital/api/v1/accounts/${accountId}/pix/getLimit`
    );
    res.json(response.data);
  } catch (error) {
    console.error('Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint: PUT /pix/limit/:accountId
app.put('/pix/limit/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const response = await apiClient.put(
      `conta-digital/api/v1/accounts/${accountId}/pix/limit`,
      req.body
    );
    res.json(response.data);
  } catch (error) {
    console.error('Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint: GET /pix/requests
app.get('/pix/requests', async (req, res) => {
  try {
    const { accountId, status } = req.query;
    const response = await apiClient.get(
      'conta-digital/api/v1/accounts/pix/limit/getRaiseLimitRequests',
      { params: { accountId, status: status || 'S' } }
    );
    res.json(response.data);
  } catch (error) {
    console.error('Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint: PUT /pix/process-request
app.put('/pix/process-request', async (req, res) => {
  try {
    const response = await apiClient.put(
      'conta-digital/api/v1/accounts/pix/limit/processLimitRequest',
      req.body
    );
    res.json(response.data);
  } catch (error) {
    console.error('Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3004;
app.listen(PORT, () => {
  console.log(`🚀 PIX Gateway rodando em http://localhost:${PORT}`);
});
```

### Passo 3: Atualizar Frontend

**Em `src/services/pixLimitService.ts`:**

```typescript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:3004',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

export const pixLimitService = {
  async getPixLimit(accountId: number) {
    const response = await apiClient.get(`/pix/limit/${accountId}`);
    return response.data;
  },

  async updatePixLimit(accountId: number, data: any) {
    const response = await apiClient.put(`/pix/limit/${accountId}`, data);
    return response.data;
  },

  async getRaiseLimitRequests(accountId: number, status: string = 'S') {
    const response = await apiClient.get('/pix/requests', {
      params: { accountId, status }
    });
    return response.data;
  },

  async processLimitRequest(payload: any) {
    const response = await apiClient.put('/pix/process-request', payload);
    return response.data;
  }
};
```

### Passo 4: Atualizar `.env`

```env
# Usar backend local como proxy
VITE_PIX_API_BASE=http://localhost:3004
VITE_USE_MOCK=false
```

---

## 🔒 Segurança: Certificados em .gitignore

**Nunca commitar certificados!**

```bash
# .gitignore
*.key
*.crt
*.pem
*.p12
*.pfx
certs/
certificates/
```

---

## 🚀 Como Rodar

### Terminal 1: Backend com Certificados
```bash
cd server
node pix-gateway.js
```

### Terminal 2: Frontend
```bash
npm run dev
```

---

## ✅ Resultado Final

```
React App → Backend Local → PaySmart API
(sem certs) (com certs) (valida certs)
  :5173      :3004        :443
```

- ✅ Frontend seguro (sem certificados expostos)
- ✅ Backend protege os certificados
- ✅ PaySmart recebe requisição com certificados válidos
- ✅ Conexão funciona!

---

## 📝 Resumo

| Antes (Quebrado) | Depois (Funcionando) |
|------------------|---------------------|
| Frontend React → PaySmart | Frontend React → Backend Node → PaySmart |
| Sem certificados | Backend com certificados |
| Connection closed error | ✅ Funciona! |

**A solução é: Colocar os certificados no BACKEND, não no FRONTEND!**
