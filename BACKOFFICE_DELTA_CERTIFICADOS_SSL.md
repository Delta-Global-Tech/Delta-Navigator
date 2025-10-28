# 🔐 Configuração de Certificados SSL/TLS para Backoffice Delta

## Visão Geral
Este guia descreve como integrar certificados SSL/TLS (CRT + Private Key) ao serviço de integração com a API PaySmart.

## Certificados Fornecidos

### 📄 Arquivos Recebidos
- **Private Key:** `deltaglobal-prd.paysmart.key`
- **Certificado:** `deltaglobal-prd.paysmart.crt`

### 📋 Informações do Certificado
```
Issuer: CN=Easy-RSA CA
Subject: C=BR, ST=Sao Paulo, L=Sao Paulo, O=Delta Global Bank, OU=TI, CN=deltabanck.com
Valid: Feb 4 2025 - Feb 4 2026
Serial: f7:98:32:12:60:4d:b3:2d:8e:7e:bf:58:46:12:25:b5
Key Size: 2048 bit RSA
```

## 🏗️ Arquitetura de Implementação

### Opção 1: Certificados no Servidor (Recomendado)

Se você está executando um servidor Node.js backend, configure HTTPS:

```typescript
// server.ts ou backend service
import https from 'https';
import fs from 'fs';
import express from 'express';

const app = express();

const options = {
  key: fs.readFileSync('./certs/deltaglobal-prd.paysmart.key'),
  cert: fs.readFileSync('./certs/deltaglobal-prd.paysmart.crt'),
  ca: fs.readFileSync('./certs/ca-bundle.crt') // Se necessário
};

const server = https.createServer(options, app);

server.listen(443, () => {
  console.log('Server rodando com mTLS em porta 443');
});
```

### Opção 2: Certificados no Cliente (Axios)

Se precisar usar certificados no frontend (menos comum, geralmente no Node.js):

```typescript
// pixLimitService.ts - Versão com mTLS
import axios, { AxiosInstance } from 'axios';
import fs from 'fs';
import path from 'path';

const createApiClientWithMTLS = (): AxiosInstance => {
  // Carregar certificados
  const key = fs.readFileSync(
    path.join(process.cwd(), 'certs/deltaglobal-prd.paysmart.key')
  );
  const cert = fs.readFileSync(
    path.join(process.cwd(), 'certs/deltaglobal-prd.paysmart.crt')
  );

  return axios.create({
    baseURL: 'https://api-v2.conta-digital.paysmart.com.br/',
    headers: {
      'x-api-key': process.env.PIX_API_KEY || '1a6109b1-096c-4e59-9026-6cd5d3caa16d',
      'Content-Type': 'application/json',
    },
    httpsAgent: new https.Agent({
      key,
      cert,
      rejectUnauthorized: false // Apenas para desenvolvimento
    }),
    timeout: 30000,
  });
};

export const pixLimitService = {
  async getPixLimit(accountId: number): Promise<PixLimitResponse> {
    const client = createApiClientWithMTLS();
    const response = await client.get<PixLimitResponse>(
      `conta-digital/api/v1/accounts/${accountId}/pix/getLimit`
    );
    return response.data;
  }
};
```

### Opção 3: Proxy com Certificados (Melhor Prática)

Configure um proxy backend que gerencia os certificados:

```typescript
// backend/routes/pix-limit.ts
import express from 'express';
import https from 'https';
import fs from 'fs';

const router = express.Router();

const apiOptions = {
  key: fs.readFileSync('./certs/deltaglobal-prd.paysmart.key'),
  cert: fs.readFileSync('./certs/deltaglobal-prd.paysmart.crt'),
  rejectUnauthorized: false
};

// Endpoint: GET /api/pix-limit/:accountId
router.get('/pix-limit/:accountId', (req, res) => {
  const { accountId } = req.params;
  
  const options = {
    hostname: 'api-v2.conta-digital.paysmart.com.br',
    path: `/conta-digital/api/v1/accounts/${accountId}/pix/getLimit`,
    method: 'GET',
    headers: {
      'x-api-key': process.env.PIX_API_KEY,
      'Content-Type': 'application/json'
    },
    ...apiOptions
  };

  const request = https.request(options, (response) => {
    let data = '';
    
    response.on('data', (chunk) => {
      data += chunk;
    });

    response.on('end', () => {
      res.json(JSON.parse(data));
    });
  });

  request.on('error', (error) => {
    console.error('Erro na requisição:', error);
    res.status(500).json({ error: error.message });
  });

  request.end();
});

export default router;
```

## 📁 Estrutura de Diretórios para Certificados

```
projeto/
├── certs/
│   ├── deltaglobal-prd.paysmart.key      # Private Key
│   ├── deltaglobal-prd.paysmart.crt      # Certificado
│   └── ca-bundle.crt                     # CA (se fornecido)
├── src/
│   └── services/
│       └── pixLimitService.ts
└── .gitignore
```

### .gitignore Update
```bash
# Certificados (NUNCA fazer commit)
certs/*.key
certs/*.pem
certs/*.p12
certs/*.pfx

# Variáveis de ambiente
.env
.env.local
.env.*.local
```

## 🔧 Configuração com Variáveis de Ambiente

### .env.example
```bash
# PaySmart API
VITE_PIX_API_BASE=https://api-v2.conta-digital.paysmart.com.br/
VITE_PIX_API_KEY=1a6109b1-096c-4e59-9026-6cd5d3caa16d
VITE_PIX_API_KEY_HEADER=x-api-key

# Certificados (caminho relativo ou absoluto)
PIX_CERT_PATH=./certs/deltaglobal-prd.paysmart.crt
PIX_KEY_PATH=./certs/deltaglobal-prd.paysmart.key
PIX_CA_PATH=./certs/ca-bundle.crt

# Modo desenvolvimento (desabilita verificação SSL)
NODE_ENV=development
```

### .env (Não versionado)
```bash
VITE_PIX_API_BASE=https://api-v2.conta-digital.paysmart.com.br/
VITE_PIX_API_KEY=1a6109b1-096c-4e59-9026-6cd5d3caa16d
VITE_PIX_API_KEY_HEADER=x-api-key

PIX_CERT_PATH=/etc/ssl/certs/deltaglobal-prd.paysmart.crt
PIX_KEY_PATH=/etc/ssl/private/deltaglobal-prd.paysmart.key
PIX_CA_PATH=/etc/ssl/certs/ca-bundle.crt

NODE_ENV=production
```

## 📝 Implementação Completa com mTLS

### Serviço Atualizado

```typescript
// src/services/pixLimitService.ts - Versão com mTLS
import axios, { AxiosInstance } from 'axios';

interface mTLSConfig {
  keyPath?: string;
  certPath?: string;
  caPath?: string;
  rejectUnauthorized?: boolean;
}

const createApiClient = (mtlsConfig?: mTLSConfig): AxiosInstance => {
  const baseConfig: any = {
    baseURL: process.env.VITE_PIX_API_BASE || 
             'https://api-v2.conta-digital.paysmart.com.br/',
    headers: {
      [process.env.VITE_PIX_API_KEY_HEADER || 'x-api-key']: 
        process.env.VITE_PIX_API_KEY || '1a6109b1-096c-4e59-9026-6cd5d3caa16d',
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  };

  // Se em ambiente Node.js (SSR ou backend)
  if (typeof window === 'undefined' && mtlsConfig) {
    try {
      const fs = require('fs');
      const https = require('https');

      const httpsAgent = new https.Agent({
        key: fs.readFileSync(mtlsConfig.keyPath || process.env.PIX_KEY_PATH || ''),
        cert: fs.readFileSync(mtlsConfig.certPath || process.env.PIX_CERT_PATH || ''),
        ca: mtlsConfig.caPath ? 
            fs.readFileSync(mtlsConfig.caPath) : 
            (process.env.PIX_CA_PATH ? fs.readFileSync(process.env.PIX_CA_PATH) : undefined),
        rejectUnauthorized: mtlsConfig.rejectUnauthorized ?? 
                           (process.env.NODE_ENV === 'production')
      });

      baseConfig.httpsAgent = httpsAgent;
    } catch (error) {
      console.warn('Certificados não disponíveis, usando conexão padrão:', error);
    }
  }

  return axios.create(baseConfig);
};

export const pixLimitService = {
  async getPixLimit(accountId: number, mtlsConfig?: mTLSConfig): Promise<PixLimitResponse> {
    try {
      const client = createApiClient(mtlsConfig);
      const response = await client.get<PixLimitResponse>(
        `conta-digital/api/v1/accounts/${accountId}/pix/getLimit`
      );
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar limite PIX:', error);
      throw error;
    }
  },

  async updatePixLimit(
    accountId: number,
    pixLimitData: PixLimitResponse,
    mtlsConfig?: mTLSConfig
  ): Promise<PixLimitResponse> {
    try {
      const client = createApiClient(mtlsConfig);
      const response = await client.put<PixLimitResponse>(
        `conta-digital/api/v1/accounts/${accountId}/pix/limit`,
        pixLimitData
      );
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar limite PIX:', error);
      throw error;
    }
  },

  // ... outros métodos com mesmo padrão
};
```

## 🚀 Deploy com Certificados

### Docker
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copiar certificados (seguro)
COPY certs/ /app/certs/

# Definir permissões apropriadas
RUN chmod 400 /app/certs/*.key

# Copiar aplicação
COPY . .

# Instalar dependências e build
RUN npm install && npm run build

# Variáveis de ambiente
ENV NODE_ENV=production
ENV PIX_CERT_PATH=/app/certs/deltaglobal-prd.paysmart.crt
ENV PIX_KEY_PATH=/app/certs/deltaglobal-prd.paysmart.key

EXPOSE 443 80

CMD ["npm", "start"]
```

### Docker Compose
```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "443:443"
      - "80:80"
    environment:
      NODE_ENV: production
      PIX_CERT_PATH: /app/certs/deltaglobal-prd.paysmart.crt
      PIX_KEY_PATH: /app/certs/deltaglobal-prd.paysmart.key
      VITE_PIX_API_KEY: ${PIX_API_KEY}
    volumes:
      - ./certs:/app/certs:ro
```

## ✅ Checklist de Implementação

- [ ] Criar diretório `/certs` no projeto
- [ ] Copiar certificados (CRT + Key) com permissões restritas
- [ ] Adicionar caminhos ao `.gitignore`
- [ ] Criar `.env.example` com variáveis
- [ ] Criar `.env` local com valores reais
- [ ] Atualizar `pixLimitService.ts` com suporte a mTLS
- [ ] Testar localmente com certificados
- [ ] Configurar variáveis de ambiente no servidor
- [ ] Deploy e teste em produção
- [ ] Validar logs de conexão SSL

## 🔍 Testes de Conexão

### Teste com curl (Linux/Mac)
```bash
curl -v \
  --cert certs/deltaglobal-prd.paysmart.crt \
  --key certs/deltaglobal-prd.paysmart.key \
  --header "x-api-key: 1a6109b1-096c-4e59-9026-6cd5d3caa16d" \
  https://api-v2.conta-digital.paysmart.com.br/conta-digital/api/v1/accounts/158/pix/getLimit
```

### Teste com PowerShell (Windows)
```powershell
$cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2("./certs/deltaglobal-prd.paysmart.crt")
$handler = New-Object System.Net.Http.HttpClientHandler
$handler.ClientCertificates.Add($cert)

$client = New-Object System.Net.Http.HttpClient($handler)
$client.DefaultRequestHeaders.Add("x-api-key", "1a6109b1-096c-4e59-9026-6cd5d3caa16d")

$response = $client.GetAsync("https://api-v2.conta-digital.paysmart.com.br/conta-digital/api/v1/accounts/158/pix/getLimit").Result
$response.Content.ReadAsStringAsync().Result
```

### Validar Certificado
```bash
# Ver informações do certificado
openssl x509 -in certs/deltaglobal-prd.paysmart.crt -text -noout

# Ver informações da chave privada
openssl rsa -in certs/deltaglobal-prd.paysmart.key -text -noout

# Validar compatibilidade
openssl verify -CAfile certs/deltaglobal-prd.paysmart.crt certs/deltaglobal-prd.paysmart.crt
```

## 🛡️ Boas Práticas de Segurança

1. **Nunca fazer commit de certificados:**
   ```bash
   echo "certs/" >> .gitignore
   git rm --cached certs/
   ```

2. **Permissões de arquivo:**
   ```bash
   chmod 400 certs/*.key    # Somente leitura para owner
   chmod 444 certs/*.crt    # Somente leitura
   ```

3. **Variáveis de ambiente:**
   - Nunca hardcodear chaves
   - Usar `.env` local (não versionado)
   - Em produção: usar secrets manager

4. **Logs:**
   - Nunca logar chaves privadas
   - Logar apenas fingerprint do certificado

## 🔄 Renovação de Certificados

O certificado fornecido é válido até **Feb 4, 2026**.

### Processo de Renovação:
1. Contatar PaySmart 60 dias antes da expiração
2. Solicitar novo certificado e chave
3. Atualizar arquivos em `/certs/`
4. Re-fazer deploy
5. Validar testes SSL

## 📊 Monitoramento

### Logs de Erro Comum

```
Error: SELF_SIGNED_CERT_IN_CHAIN
→ Solução: Adicionar CA bundle ou desabilitar rejectUnauthorized

Error: ENOENT: no such file or directory
→ Solução: Verificar caminho dos certificados

Error: 403 Forbidden
→ Solução: Validar certificado com PaySmart

Error: SSL_ERROR_RX_RECORD_TOO_LONG
→ Solução: Confirmar que é HTTPS, não HTTP
```

## 🎯 Próximos Passos

1. Copiar certificados para o projeto
2. Implementar a versão com mTLS
3. Testar localmente
4. Configurar CI/CD para deploy seguro
5. Monitorar certificado até expiração

---

**Status:** 🟢 Pronto para Implementação  
**Prioridade:** Alta para Produção  
**Data de Validade do Certificado:** Feb 4, 2026
