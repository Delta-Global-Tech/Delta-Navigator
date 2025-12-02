# 🔐 Encriptação na SUA Plataforma (Passo a Passo Real)

**Data**: 25 de Novembro de 2025  
**Foco**: Como funciona EXATAMENTE no seu código

---

## 📐 ARQUITETURA ATUAL DA SUA PLATAFORMA

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                      │
│          src/ → Vite → localhost:5173                    │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP/API
┌────────────────────────▼────────────────────────────────┐
│              BACKEND NODEJS (Porta 3003)                │
│    server/ → contratos-server (seu microserviço)        │
│    - Recebe: cliente_cpf, cliente_nome, etc             │
│    - Processa: Busca, cria, atualiza propostas          │
└────────────────────────┬────────────────────────────────┘
                         │ Query SQL
┌────────────────────────▼────────────────────────────────┐
│         POSTGRE SQL (192.168.8.149:5432)                │
│         Banco: airflow_treynor                           │
│         Tabela: fact_proposals_newcorban                │
│         - 43 colunas                                    │
│         - Dados guardados                               │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 CENÁRIO REAL: Criar uma Proposta

### HOJE (SEM ENCRIPTAÇÃO) - Inseguro ❌

**Usuário preenche formulário no frontend:**
```
Nome: João Silva Santos
CPF: 123.456.789-00
Renda: R$ 5.000,00
Valor a Financiar: R$ 50.000,00
```

**Frontend envia para Backend:**
```typescript
// src/components/ProposalForm.tsx
const handleSubmit = async (data) => {
  const response = await fetch('http://localhost:3003/api/proposals', {
    method: 'POST',
    body: JSON.stringify({
      cliente_nome: "João Silva Santos",        // ← Texto simples
      cliente_cpf: "12345678900",               // ← Texto simples
      cliente_renda: 5000.00,                   // ← Número simples
      valor_financiado: 50000.00                // ← Número simples
    })
  });
};
```

**Backend recebe e salva direto:**
```typescript
// contratos-server/server.js (HOJE - SEM ENCRIPTAÇÃO)
app.post('/api/proposals', (req, res) => {
  const { cliente_nome, cliente_cpf, cliente_renda, valor_financiado } = req.body;

  // ⚠️ PROBLEMA: Salva os dados COMO ESTÃO
  const query = `
    INSERT INTO fact_proposals_newcorban 
    (cliente_nome, cliente_cpf, cliente_renda, valor_financiado)
    VALUES ($1, $2, $3, $4)
  `;

  db.query(query, [
    cliente_nome,        // ← "João Silva Santos"
    cliente_cpf,         // ← "12345678900"
    cliente_renda,       // ← 5000.00
    valor_financiado     // ← 50000.00
  ]);
});
```

**No banco de dados (HOJE):**
```
fact_proposals_newcorban:
┌─────────────────────────────────────────┐
│ cliente_nome    │ João Silva Santos      │  ← LEGÍVEL!
│ cliente_cpf     │ 12345678900            │  ← LEGÍVEL!
│ cliente_renda   │ 5000.00                │  ← LEGÍVEL!
│ valor_financiado│ 50000.00               │  ← LEGÍVEL!
└─────────────────────────────────────────┘

Problema: Qualquer DBA, admin do servidor, ou alguém que
acessa ilegalmente o banco VÊ TUDO CLARAMENTE.
VIOLAÇÃO DE LGPD! 🚨
```

---

## 🔐 DEPOIS (COM ENCRIPTAÇÃO) - Seguro ✅

### Passo 1: Criar o EncryptionService

**Novo arquivo:**
```typescript
// src/services/EncryptionService.ts

import crypto from 'crypto';
import axios from 'axios';

export class EncryptionService {
  private encryptionKey: string = '';
  
  constructor(private vaultUrl: string, private vaultToken: string) {}

  // 1️⃣ Busca a chave do Vault na inicialização
  async initializeKey() {
    const response = await axios.get(
      `${this.vaultUrl}/v1/secret/data/encryption/key`,
      {
        headers: { 'X-Vault-Token': this.vaultToken }
      }
    );
    
    this.encryptionKey = response.data.data.data.key;
    console.log('✅ Chave de encriptação carregada do Vault');
  }

  // 2️⃣ Encripta um valor
  encrypt(plaintext: string | number): string {
    const iv = crypto.randomBytes(16); // Gera um IV aleatório
    
    const cipher = crypto.createCipheriv(
      'aes-256-gcm',
      Buffer.from(this.encryptionKey.substring(0, 32)), // 32 bytes = 256 bits
      iv
    );

    let encrypted = cipher.update(String(plaintext), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Retorna: IV + authTag + encrypted (para conseguir decriptar depois)
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  // 3️⃣ Decripta um valor
  decrypt(encrypted: string): string {
    const parts = encrypted.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encryptedText = parts[2];

    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      Buffer.from(this.encryptionKey.substring(0, 32)),
      iv
    );

    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}

// Inicialização (na inicialização do servidor)
const encryptionService = new EncryptionService(
  'http://vault:8200',  // Endereço do Vault no Docker
  process.env.VAULT_TOKEN || 'seu-token-aqui'
);

await encryptionService.initializeKey();
```

### Passo 2: Modificar o Backend

**Backend ANTES (sem encriptação):**
```typescript
// contratos-server/server.js (HOJE)
app.post('/api/proposals', (req, res) => {
  const { cliente_nome, cliente_cpf, cliente_renda, valor_financiado } = req.body;

  const query = `
    INSERT INTO fact_proposals_newcorban 
    (cliente_nome, cliente_cpf, cliente_renda, valor_financiado)
    VALUES ($1, $2, $3, $4)
  `;

  db.query(query, [
    cliente_nome,      // João Silva Santos
    cliente_cpf,       // 12345678900
    cliente_renda,     // 5000.00
    valor_financiado   // 50000.00
  ]);
});
```

**Backend DEPOIS (com encriptação):**
```typescript
// contratos-server/server.js (NOVO - COM ENCRIPTAÇÃO)
import { EncryptionService } from '../src/services/EncryptionService';

const encryptionService = new EncryptionService(...);

app.post('/api/proposals', (req, res) => {
  const { cliente_nome, cliente_cpf, cliente_renda, valor_financiado } = req.body;

  // 🔐 NOVO: Encripta os 9 campos críticos
  const clienteNomeEncriptado = encryptionService.encrypt(cliente_nome);
  const clienteCpfEncriptado = encryptionService.encrypt(cliente_cpf);
  const clienteRendaEncriptada = encryptionService.encrypt(String(cliente_renda));
  const valorFinanciadoEncriptado = encryptionService.encrypt(String(valor_financiado));

  // ✅ Salva os dados ENCRIPTADOS
  const query = `
    INSERT INTO fact_proposals_newcorban 
    (cliente_nome, cliente_cpf, cliente_renda, valor_financiado)
    VALUES ($1, $2, $3, $4)
  `;

  db.query(query, [
    clienteNomeEncriptado,       // 🔐 Encriptado!
    clienteCpfEncriptado,        // 🔐 Encriptado!
    clienteRendaEncriptada,      // 🔐 Encriptado!
    valorFinanciadoEncriptado    // 🔐 Encriptado!
  ]);
});
```

### Passo 3: No Banco de Dados

**Resultado (DEPOIS COM ENCRIPTAÇÃO):**
```
fact_proposals_newcorban:
┌──────────────────────────────────────────────────────────┐
│ cliente_nome    │ a7f3k2:9d8c5e:2f4a6b8c9d0e1f2a3b4c5d... │
│ cliente_cpf     │ x2m9k1:4b7e9f:1a2b3c4d5e6f7g8h9i0j... │
│ cliente_renda   │ q5n8p2:7c3d9e:9z8y7x6w5v4u3t2s1r0q... │
│ valor_financiad │ w3b6m4:8e1f2g:5h4i3j2k1l0m9n8o7p6q... │
└──────────────────────────────────────────────────────────┘

Resultado: Dados ilegíveis! ✅
Se alguém acessar o banco ilegalmente, vê apenas "lixo".
```

---

## 📖 CENÁRIO REAL 2: Ler uma Proposta

### Usuário quer VER os dados que preencheu

**Frontend solicita dados:**
```typescript
// src/components/ProposalDetail.tsx
const handleLoadProposal = async (proposalId) => {
  const response = await fetch(
    `http://localhost:3003/api/proposals/${proposalId}`
  );
  const data = await response.json();
  
  // Backend retorna dados legíveis (decriptados)
  console.log(data.cliente_nome);  // "João Silva Santos" ✅
  console.log(data.cliente_cpf);   // "12345678900" ✅
};
```

**Backend ANTES (sem encriptação):**
```typescript
// contratos-server/server.js (HOJE)
app.get('/api/proposals/:id', (req, res) => {
  const query = `
    SELECT cliente_nome, cliente_cpf, cliente_renda, valor_financiado
    FROM fact_proposals_newcorban
    WHERE proposta_id = $1
  `;

  db.query(query, [req.params.id], (err, result) => {
    // Retorna dados COMO ESTÃO (legíveis)
    res.json(result.rows[0]);
  });
});
```

**Backend DEPOIS (com encriptação):**
```typescript
// contratos-server/server.js (NOVO - COM ENCRIPTAÇÃO)
app.get('/api/proposals/:id', (req, res) => {
  const query = `
    SELECT cliente_nome, cliente_cpf, cliente_renda, valor_financiado
    FROM fact_proposals_newcorban
    WHERE proposta_id = $1
  `;

  db.query(query, [req.params.id], (err, result) => {
    const proposal = result.rows[0];

    // 🔐 NOVO: Decripta antes de retornar
    const decryptedProposal = {
      proposta_id: proposal.proposta_id,  // Não encriptado (chave)
      cliente_nome: encryptionService.decrypt(proposal.cliente_nome),        // Decripta
      cliente_cpf: encryptionService.decrypt(proposal.cliente_cpf),          // Decripta
      cliente_renda: parseFloat(
        encryptionService.decrypt(proposal.cliente_renda)
      ),                                                                       // Decripta
      valor_financiado: parseFloat(
        encryptionService.decrypt(proposal.valor_financiado)
      )                                                                        // Decripta
    };

    // ✅ Retorna dados legíveis
    res.json(decryptedProposal);
  });
});
```

**Resultado no Frontend:**
```
Nome: João Silva Santos      ✅ (legível)
CPF: 12345678900            ✅ (legível)
Renda: 5000.00              ✅ (legível)
```

---

## 🔄 FLUXO COMPLETO NA SUA PLATAFORMA

```
┌──────────────────────────────────────────────────────────┐
│  1️⃣ USUÁRIO PREENCHE FORMULÁRIO NO FRONTEND             │
│  Dados: João, 123456789, 5000                           │
└────────────────────┬─────────────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────────────┐
│  2️⃣ FRONTEND ENVIA PARA BACKEND (HTTP POST)             │
│  URL: http://localhost:3003/api/proposals               │
│  Body: { cliente_nome, cliente_cpf, cliente_renda }     │
└────────────────────┬─────────────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────────────┐
│  3️⃣ BACKEND RECEBE (contratos-server)                   │
│  app.post('/api/proposals', (req, res) => {             │
│    const { cliente_nome, cliente_cpf } = req.body;      │
└────────────────────┬─────────────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────────────┐
│  4️⃣ ENCRIPTA OS DADOS (NOVO!)                          │
│  cliente_nome = "João" → "a7f3k2:9d8c5e:2f4a6b..."      │
│  cliente_cpf = "123456789" → "x2m9k1:4b7e9f:1a2b3c..." │
└────────────────────┬─────────────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────────────┐
│  5️⃣ BACKEND SALVA NO BANCO (PostgreSQL)                │
│  INSERT INTO fact_proposals_newcorban                   │
│  VALUES ("a7f3k2:9d8c5e:...", "x2m9k1:4b7e9f:...")    │
│  🔐 Dados encriptados guardados!                        │
└────────────────────┬─────────────────────────────────────┘
                     │
             ┌───────▼────────┐
             │  DEPOIS...      │
             │  Usuário quer   │
             │  ver os dados   │
             └───────┬────────┘
                     │
┌────────────────────▼─────────────────────────────────────┐
│  6️⃣ FRONTEND SOLICITA DADOS (HTTP GET)                 │
│  URL: http://localhost:3003/api/proposals/123          │
└────────────────────┬─────────────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────────────┐
│  7️⃣ BACKEND BUSCA NO BANCO                              │
│  SELECT cliente_nome, cliente_cpf FROM ...              │
│  Resultado: "a7f3k2:9d8c5e:...", "x2m9k1:4b7e9f:..."   │
└────────────────────┬─────────────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────────────┐
│  8️⃣ DECRIPTA OS DADOS (NOVO!)                          │
│  "a7f3k2:9d8c5e:..." → "João"                          │
│  "x2m9k1:4b7e9f:..." → "12345678900"                   │
└────────────────────┬─────────────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────────────┐
│  9️⃣ BACKEND RETORNA PARA FRONTEND                       │
│  { cliente_nome: "João", cliente_cpf: "12345678900" }  │
└────────────────────┬─────────────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────────────┐
│  🔟 USUÁRIO VÊ OS DADOS NO FRONTEND                     │
│  Nome: João Silva Santos ✅                             │
│  CPF: 12345678900 ✅                                    │
│  (Dados legíveis novamente)                             │
└──────────────────────────────────────────────────────────┘
```

---

## 📝 MUDANÇAS NECESSÁRIAS NA SUA PLATAFORMA

### 1. Criar EncryptionService.ts
```
src/services/
└── EncryptionService.ts  (novo arquivo)
```

### 2. Modificar contratos-server
```
contratos-server/
├── server.js  (adiciona import + encriptação/decriptação)
└── package.json  (já tem crypto, pois vem com Node)
```

### 3. Criar Migration do Banco
```
migrations/
└── 001_add_encryption_columns.sql  (opcional - renomear colunas)
```

### 4. Atualizar .env
```
VAULT_URL=http://vault:8200
VAULT_TOKEN=seu-token-do-vault
ENCRYPTION_KEY_PATH=secret/delta/encryption_key  (já existe!)
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

- [ ] Criar `src/services/EncryptionService.ts`
- [ ] Importar EncryptionService no `contratos-server/server.js`
- [ ] Modificar POST `/api/proposals` para encriptar
- [ ] Modificar GET `/api/proposals/:id` para decriptar
- [ ] Testar com dados de exemplo
- [ ] Executar script para encriptar dados históricos
- [ ] Deploy em produção

---

## ⚡ TEMPO ESTIMADO

```
- Criar EncryptionService: 15 min
- Modificar backend: 20 min
- Testar: 15 min
- Migrar dados históricos: 30 min

TOTAL: ~80 minutos (pouco mais de 1 hora) ⏰
```

---

## ❓ PERGUNTAS FREQUENTES

**P: Meu frontend vai mudar?**  
R: NÃO! Frontend continua igual. Backend cuida da encriptação.

**P: Meus relatórios vão funcionar?**  
R: SIM! Backend decripta antes de gerar relatório.

**P: Posso fazer buscas por CPF encriptado?**  
R: NÃO (mas há soluções). Por enquanto: busca no frontend.

**P: Vai ficar mais lento?**  
R: Muito pouco! AES-256 é rápido (< 1ms por campo).

**P: E se a chave do Vault cair?**  
R: Vault tem backup automático no Docker. Dados não são perdidos.

---

## 🚀 Pronto?

Quer que eu:
- [ ] Crie o `EncryptionService.ts` completo?
- [ ] Mostre EXATAMENTE como modificar seu `contratos-server/server.js`?
- [ ] Prepare um script para encriptar dados históricos?
- [ ] Tudo junto?

Avisa! 🎯
