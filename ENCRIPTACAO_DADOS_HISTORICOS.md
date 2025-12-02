# 🔐 Encriptação de Dados Históricos (Dados Já Populados)

**Data**: 25 de Novembro de 2025  
**Situação**: Você **LÊ** dados do banco, não SALVA

---

## 📌 SUA SITUAÇÃO REAL

```
┌──────────────────────────────────────────────┐
│  BANCO JÁ TEM DADOS                         │
│  fact_proposals_newcorban                   │
│  - 1 milhão de propostas                    │
│  - cliente_cpf em PLAINTEXT ❌              │
│  - cliente_nome em PLAINTEXT ❌             │
│  - valores em PLAINTEXT ❌                  │
└──────────────────────────────────────────────┘
                    │
        ┌───────────▼────────────┐
        │ SUA PLATAFORMA         │
        │ - LÊ dados do banco    │
        │ - Mostra na tela       │
        │ - Gera relatórios      │
        │ - NÃO SALVA nada       │
        └───────────┬────────────┘
                    │
        ┌───────────▼────────────┐
        │  USUÁRIO VÊ:           │
        │  - CPF: 123456789      │
        │  - Nome: João          │
        │  - Renda: 5000         │
        └───────────────────────┘
```

---

## 🎯 ESTRATÉGIA

Você precisa:

### Passo 1: Encriptar os dados HISTÓRICOS no banco
```
ANTES: cliente_cpf = "12345678900"
DEPOIS: cliente_cpf = "$2a$12$x9K2L8m..."
```

### Passo 2: Modificar apenas a LEITURA
```
Backend lê do banco: "$2a$12$x9K2L8m..."
Backend decripta: "12345678900"
Usuário vê: "12345678900" (normal!)
```

---

## 🚀 IMPLEMENTAÇÃO (Bem mais simples!)

### Passo 1: Criar EncryptionService (MESMO DE ANTES)

```typescript
// src/services/EncryptionService.ts

import crypto from 'crypto';
import axios from 'axios';

export class EncryptionService {
  private encryptionKey: string = '';
  
  constructor(private vaultUrl: string, private vaultToken: string) {}

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

  encrypt(plaintext: string | number): string {
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv(
      'aes-256-gcm',
      Buffer.from(this.encryptionKey.substring(0, 32)),
      iv
    );

    let encrypted = cipher.update(String(plaintext), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

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

// Inicializar na startup
const encryptionService = new EncryptionService(
  process.env.VAULT_URL || 'http://vault:8200',
  process.env.VAULT_TOKEN || ''
);

await encryptionService.initializeKey();
export default encryptionService;
```

---

### Passo 2: Script para Encriptar Dados Históricos

**Este script roda UMA VEZ para converter os dados existentes:**

```typescript
// scripts/encrypt-historical-data.ts

import { EncryptionService } from '../src/services/EncryptionService';
import db from '../contratos-server/database'; // sua conexão

const encryptionService = new EncryptionService(
  process.env.VAULT_URL!,
  process.env.VAULT_TOKEN!
);

async function encryptHistoricalData() {
  console.log('🔐 Iniciando encriptação de dados históricos...\n');

  try {
    // 1️⃣ Busca TODOS os registros que precisam ser encriptados
    const proposals = await db.query(
      `SELECT proposta_id, cliente_cpf, cliente_nome, cliente_nascimento, 
              cliente_sexo, cliente_matricula, cliente_renda, 
              valor_financiado, valor_liberado, valor_parcela
       FROM fact_proposals_newcorban
       WHERE cliente_cpf IS NOT NULL`
    );

    console.log(`📊 Encontradas ${proposals.rows.length} propostas para encriptar\n`);

    // 2️⃣ Processa em lotes (100 por vez, para não travar)
    const BATCH_SIZE = 100;
    let processed = 0;

    for (let i = 0; i < proposals.rows.length; i += BATCH_SIZE) {
      const batch = proposals.rows.slice(i, i + BATCH_SIZE);

      for (const row of batch) {
        // 🔐 Encripta os 9 campos críticos
        const encryptedData = {
          cliente_cpf: encryptionService.encrypt(row.cliente_cpf || ''),
          cliente_nome: encryptionService.encrypt(row.cliente_nome || ''),
          cliente_nascimento: row.cliente_nascimento 
            ? encryptionService.encrypt(row.cliente_nascimento.toISOString())
            : null,
          cliente_sexo: encryptionService.encrypt(row.cliente_sexo || ''),
          cliente_matricula: encryptionService.encrypt(row.cliente_matricula || ''),
          cliente_renda: encryptionService.encrypt(String(row.cliente_renda || '')),
          valor_financiado: encryptionService.encrypt(String(row.valor_financiado || '')),
          valor_liberado: encryptionService.encrypt(String(row.valor_liberado || '')),
          valor_parcela: encryptionService.encrypt(String(row.valor_parcela || ''))
        };

        // ✅ Atualiza o banco com dados ENCRIPTADOS
        await db.query(
          `UPDATE fact_proposals_newcorban SET
            cliente_cpf = $1,
            cliente_nome = $2,
            cliente_nascimento = $3,
            cliente_sexo = $4,
            cliente_matricula = $5,
            cliente_renda = $6,
            valor_financiado = $7,
            valor_liberado = $8,
            valor_parcela = $9
           WHERE proposta_id = $10`,
          [
            encryptedData.cliente_cpf,
            encryptedData.cliente_nome,
            encryptedData.cliente_nascimento,
            encryptedData.cliente_sexo,
            encryptedData.cliente_matricula,
            encryptedData.cliente_renda,
            encryptedData.valor_financiado,
            encryptedData.valor_liberado,
            encryptedData.valor_parcela,
            row.proposta_id
          ]
        );

        processed++;
      }

      console.log(`✅ ${processed}/${proposals.rows.length} registros processados`);
    }

    console.log('\n🎉 Encriptação concluída!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Erro durante encriptação:', error);
    process.exit(1);
  }
}

// Executar
encryptHistoricalData();
```

**Para rodar:**
```bash
npm run encrypt-historical
```

---

### Passo 3: Modificar Backend para LER Dados Encriptados

**ANTES (Lê plaintext):**
```typescript
// contratos-server/server.js (HOJE)
app.get('/api/proposals/:id', (req, res) => {
  const query = `
    SELECT cliente_cpf, cliente_nome, cliente_renda, valor_financiado
    FROM fact_proposals_newcorban
    WHERE proposta_id = $1
  `;

  db.query(query, [req.params.id], (err, result) => {
    // Retorna PLAINTEXT do banco
    res.json(result.rows[0]);
  });
});
```

**DEPOIS (Lê encriptado, decripta antes de retornar):**
```typescript
// contratos-server/server.js (NOVO)
import encryptionService from '../src/services/EncryptionService';

app.get('/api/proposals/:id', (req, res) => {
  const query = `
    SELECT proposta_id, cliente_cpf, cliente_nome, cliente_nascimento,
           cliente_sexo, cliente_matricula, cliente_renda, 
           valor_financiado, valor_liberado, valor_parcela
    FROM fact_proposals_newcorban
    WHERE proposta_id = $1
  `;

  db.query(query, [req.params.id], (err, result) => {
    if (err || !result.rows[0]) {
      return res.status(404).json({ error: 'Proposta não encontrada' });
    }

    const row = result.rows[0];

    // 🔐 NOVO: Decripta os 9 campos
    const decryptedProposal = {
      proposta_id: row.proposta_id,  // NÃO decripta (é chave)
      cliente_cpf: row.cliente_cpf ? encryptionService.decrypt(row.cliente_cpf) : null,
      cliente_nome: row.cliente_nome ? encryptionService.decrypt(row.cliente_nome) : null,
      cliente_nascimento: row.cliente_nascimento 
        ? new Date(encryptionService.decrypt(row.cliente_nascimento))
        : null,
      cliente_sexo: row.cliente_sexo ? encryptionService.decrypt(row.cliente_sexo) : null,
      cliente_matricula: row.cliente_matricula ? encryptionService.decrypt(row.cliente_matricula) : null,
      cliente_renda: row.cliente_renda 
        ? parseFloat(encryptionService.decrypt(row.cliente_renda))
        : null,
      valor_financiado: row.valor_financiado 
        ? parseFloat(encryptionService.decrypt(row.valor_financiado))
        : null,
      valor_liberado: row.valor_liberado 
        ? parseFloat(encryptionService.decrypt(row.valor_liberado))
        : null,
      valor_parcela: row.valor_parcela 
        ? parseFloat(encryptionService.decrypt(row.valor_parcela))
        : null
    };

    res.json(decryptedProposal);
  });
});
```

---

## 🔄 Fluxo Completo (Leitura Apenas)

```
┌─────────────────────────────────────────────┐
│  1️⃣ USUÁRIO ACESSA PROPOSTA                │
│  Frontend: GET /api/proposals/123           │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│  2️⃣ BACKEND BUSCA NO BANCO                 │
│  SELECT * FROM fact_proposals_newcorban     │
│  Resultado: "$2a$12$x9K2L8m..." (encript)  │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│  3️⃣ BACKEND DECRIPTA                       │
│  decrypt("$2a$12$...") → "12345678900"     │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│  4️⃣ BACKEND RETORNA PARA FRONTEND          │
│  { cliente_cpf: "12345678900", ... }        │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│  5️⃣ USUÁRIO VÊ NO FRONTEND                 │
│  CPF: 123.456.789-00 ✅ (normal!)          │
│  Nome: João Silva ✅                        │
│  (Tudo funciona como antes, mas dados      │
│   protegidos no banco)                      │
└─────────────────────────────────────────────┘
```

---

## 📋 Passo a Passo de Implementação

### 1️⃣ Criar EncryptionService
```bash
# Criar arquivo
src/services/EncryptionService.ts
# (copiar código acima)
```

### 2️⃣ Criar Script de Encriptação
```bash
# Criar arquivo
scripts/encrypt-historical-data.ts
# (copiar código acima)
```

### 3️⃣ Adicionar Script ao package.json
```json
{
  "scripts": {
    "encrypt-historical": "ts-node scripts/encrypt-historical-data.ts"
  }
}
```

### 4️⃣ Executar Encriptação (1x)
```bash
npm run encrypt-historical
# Demora alguns minutos (depende de quantos registros)
```

### 5️⃣ Modificar Backend
```bash
# Editar: contratos-server/server.js
# Adicionar import do EncryptionService
# Modificar endpoints GET para decriptar
```

### 6️⃣ Testar
```bash
# Teste em staging antes de deploy
# Verificar se dados aparecem corretos na tela
```

---

## ⚡ DIFERENÇAS IMPORTANTES

### ❌ VOCÊ NÃO FAZ:
- Não precisa encriptar no POST (você não salva)
- Não precisa modificar formulários (só lê)
- Não precisa alterar estrutura do banco

### ✅ VOCÊ FAZ:
- ✅ Encripta dados HISTÓRICOS uma vez (script)
- ✅ Decripta na leitura (backend GET)
- ✅ Dados no banco ficam protegidos
- ✅ Frontend vê tudo normal

---

## ⏱️ TEMPO ESTIMADO

```
- Criar EncryptionService: 10 min
- Criar script encriptação: 10 min
- Executar script: 10-30 min (depende de volume)
- Modificar backend: 15 min
- Testar: 15 min

TOTAL: ~60-90 minutos ⏰
```

---

## 📊 EXEMPLO PRÁTICO

**Antes da encriptação:**
```
postgresql=# SELECT cliente_cpf, cliente_nome FROM fact_proposals_newcorban LIMIT 1;
 cliente_cpf  │ cliente_nome
──────────────┼──────────────
 12345678900  │ João Silva      ← LEGÍVEL! Inseguro!
(1 row)
```

**Depois da encriptação:**
```
postgresql=# SELECT cliente_cpf, cliente_nome FROM fact_proposals_newcorban LIMIT 1;
      cliente_cpf      │        cliente_nome
───────────────────────┼────────────────────────
 a7f3k2:9d8c5e:2f4a... │ x2m9k1:4b7e9f:1a2b... ← ILEGÍVEL! Seguro!
(1 row)
```

**Quando usuário acessa via backend:**
```
GET /api/proposals/123

{
  "proposta_id": "123",
  "cliente_cpf": "12345678900",      ← Decriptado! Legível!
  "cliente_nome": "João Silva",      ← Decriptado! Legível!
  ...
}
```

---

## ✅ CHECKLIST

- [ ] Criar `src/services/EncryptionService.ts`
- [ ] Criar `scripts/encrypt-historical-data.ts`
- [ ] Adicionar script no `package.json`
- [ ] Testar EncryptionService (encrypt/decrypt)
- [ ] Executar script de encriptação (⚠️ faz backup do banco ANTES!)
- [ ] Modificar `contratos-server/server.js` (endpoints GET)
- [ ] Testar leitura no staging
- [ ] Deploy em produção

---

## ⚠️ IMPORTANTE: FAÇA BACKUP ANTES!

```bash
# Backup do banco ANTES de encriptar!
docker exec airflow2-postgres pg_dump -U postgres airflow_treynor > backup-antes.sql

# Se der problema, restaura:
docker exec airflow2-postgres psql -U postgres airflow_treynor < backup-antes.sql
```

---

## ❓ PERGUNTAS

**P: Vai travar meu sistema durante encriptação?**  
R: Não! Script roda em batch (100 por vez) sem lock total.

**P: Quanto tempo demora?**  
R: ~1 minuto por 100.000 registros (depende do servidor).

**P: Posso reverter?**  
R: Sim! Tem backup. Mas não dá pra "desencriptar" sem a chave.

**P: E buscas por CPF?**  
R: Não funciona (encriptado não é indexável). Solução: buscar em memória.

**P: Relatórios ainda funcionam?**  
R: Sim! Backend decripta antes de gerar.

---

## 🚀 Pronto para começar?

Quer que eu:
- [ ] Crie o EncryptionService.ts pronto?
- [ ] Crie o script de encriptação pronto?
- [ ] Mostre EXATAMENTE o que modificar no seu backend?
- [ ] Tudo junto?

Avisa! 🎯
