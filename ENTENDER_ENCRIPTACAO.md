# 🔐 O que é a Encriptação que Vamos Fazer?

**Data**: 25 de Novembro de 2025

---

## 📌 RESUMO SIMPLES

Vamos transformar dados **legíveis** em dados **ilegíveis** no banco de dados.

### ANTES (Hoje - Inseguro) ❌
```
Banco de Dados PostgreSQL:
┌────────────────────────────────────────┐
│ cliente_cpf    │ 12345678900           │
│ cliente_nome   │ João Silva Santos      │
│ cliente_renda  │ 5000.00                │
└────────────────────────────────────────┘

Se alguém acessar o banco sem permissão, vê TUDO claramente.
```

### DEPOIS (Depois da encriptação - Seguro) ✅
```
Banco de Dados PostgreSQL:
┌────────────────────────────────────────┐
│ cliente_cpf    │ $2a$12$x9K2L8m...... │
│ cliente_nome   │ $2a$12$p9Q3N5x...... │
│ cliente_renda  │ $2a$12$y5R8P2t...... │
└────────────────────────────────────────┘

Se alguém acessar o banco, vê apenas "lixo" ilegível.
Só quem tem a CHAVE consegue ler.
```

---

## 🔑 COMO FUNCIONA A CHAVE?

### Analogia Simples: Cofre

```
SEM ENCRIPTAÇÃO:
┌─────────────────────┐
│  Dinheiro na mesa   │  ← Qualquer um pega
└─────────────────────┘

COM ENCRIPTAÇÃO:
┌──────────────────────────┐
│  Dinheiro dentro do      │
│  cofre com senha 🔐      │
│  (Apenas quem sabe a     │
│   senha consegue abrir)  │
└──────────────────────────┘
```

### Na Prática:

**Chave de Encriptação**: String gerada aleatoriamente (tipo "xK9m2P@8qL#5vN")
- **Guarda**: Dentro do **Vault** (já temos!)
- **Uso**: Encripta dados ao GRAVAR, Decripta dados ao LER

---

## 🛠️ COMO VAI FUNCIONAR NO SEU CÓDIGO

### HOJE (Sem Encriptação)
```typescript
// Backend recebe dados do cliente
const cpf = "12345678900";

// Salva direto no banco (inseguro!)
await database.query(
  `INSERT INTO fact_proposals_newcorban (cliente_cpf) VALUES ($1)`,
  [cpf]
);
// Resultado no BD: "12345678900" (legível)
```

### DEPOIS (Com Encriptação)
```typescript
// Backend recebe dados do cliente
const cpf = "12345678900";

// 1️⃣ Encripta os dados
const cpfEncriptado = encryptionService.encrypt(cpf);
// Resultado: "$2a$12$x9K2L8m......" (ilegível)

// 2️⃣ Salva no banco (seguro!)
await database.query(
  `INSERT INTO fact_proposals_newcorban (cliente_cpf) VALUES ($1)`,
  [cpfEncriptado]
);
// Resultado no BD: "$2a$12$x9K2L8m......" (ilegível)

// 3️⃣ Quando precisa LER o CPF
const dadosDoClienteEncriptado = await database.query(
  `SELECT cliente_cpf FROM fact_proposals_newcorban WHERE proposta_id = $1`,
  [propostaId]
);

// 4️⃣ Decripta para exibir
const cpfLegivel = encryptionService.decrypt(dadosDoClienteEncriptado.cliente_cpf);
// Resultado: "12345678900" (novamente legível, mas apenas quando necessário)
```

---

## 🔐 QUE TIPO DE ENCRIPTAÇÃO?

Vamos usar: **AES-256-GCM**

### O que significa:
- **AES**: Advanced Encryption Standard (padrão militar)
- **256**: Chave de 256 bits (extremamente segura)
- **GCM**: Garante que ninguém alterou os dados (autenticação)

### Por que AES-256?
✅ Aprovado pelo BACEN (Banco Central do Brasil)  
✅ Reconhecido internacionalmente (NIST, ISO)  
✅ Praticamente impossível quebrar (2^256 combinações)  
✅ Rápido para operações de banco de dados  

---

## 📊 FLUXO COMPLETO

```
PESSOA ENTRA COM DADOS
        ↓
┌──────────────────────────────────────┐
│  Backend Node.js                     │
│  - Recebe: cliente_cpf = "123456..."│
│  - Encripta com Vault Key            │
│  - Envia para BD                     │
└──────────────────────────────────────┘
        ↓
┌──────────────────────────────────────┐
│  PostgreSQL airflow_treynor          │
│  - Armazena: "$2a$12$x9K2L8m..."   │
│  - Ilegível para qualquer um         │
│  - Só código tem acesso à chave      │
└──────────────────────────────────────┘
        ↓
VOCÊ PRECISA MOSTRAR OS DADOS
        ↓
┌──────────────────────────────────────┐
│  Backend Node.js                     │
│  - Busca: "$2a$12$x9K2L8m..."      │
│  - Decripta com Vault Key            │
│  - Retorna: "123456..."              │
└──────────────────────────────────────┘
        ↓
PESSOA VÊ DADOS NA TELA (seguro)
```

---

## 💾 ONDE FICA A CHAVE?

### Hoje (Inseguro) ❌
```
Chave no arquivo .env:
├── .env
│   └── DATABASE_PASSWORD="senha123"  ← Visível no servidor
│   └── ENCRYPTION_KEY="minha_chave"  ← QUALQUER UM VÊ!
└── Problema: Git pode vazar, DBA acessa, etc.
```

### Depois (Seguro) ✅
```
Chave no Vault (já temos!)
├── Vault v1.21.1 (em Docker)
│   └── secret/delta/encryption_key = "xK9m2P@8qL#5vN"
└── Apenas seu código acessa via API Vault
   └── Ninguém mais vê a chave
```

---

## ⚡ O QUE VAI MUDAR NO SEU PROJETO?

### Arquivos Novos:
```
src/
├── services/
│   └── EncryptionService.ts  ← Novo! Encripta/Decripta
```

### Arquivos Modificados:
```
server/
├── routes/
│   └── proposals.ts          ← Agora encripta antes de salvar
└── middleware/
    └── data-access.ts        ← Agora decripta ao acessar
```

### Banco de Dados:
```sql
-- MIGRATION 001: Converter campos para encriptação

ALTER TABLE fact_proposals_newcorban
  RENAME COLUMN cliente_cpf TO cliente_cpf_encrypted;

ALTER TABLE fact_proposals_newcorban
  RENAME COLUMN cliente_nome TO cliente_nome_encrypted;

-- E assim para os 9 campos...
```

---

## 🚀 CRONOGRAMA

### Fase 1: Preparação (2 dias)
- [ ] Criar `EncryptionService.ts`
- [ ] Testar encriptação/decriptação
- [ ] Guardar chave no Vault

### Fase 2: Migração (3 dias)
- [ ] Encriptar dados históricos (batch process)
- [ ] Atualizar código para usar encriptação
- [ ] Testar em staging

### Fase 3: Deploy (1 dia)
- [ ] Deploy em produção
- [ ] Monitorar logs
- [ ] Validar dados

**Total: ~1 semana**

---

## ❓ PERGUNTAS COMUNS

### P: Vai ficar mais lento?
**R**: Muito pouco! AES-256 é rápido. ~1ms por operação.

### P: E se perder a chave?
**R**: Por isso a chave está no Vault (com backup automático).

### P: Posso ainda fazer relatórios?
**R**: Sim! Decripta na memória, processa, gera relatório.

### P: Todos os 9 campos?
**R**: Sim, os 9 críticos que identificamos:
1. cliente_cpf ✅
2. cliente_nome ✅
3. cliente_nascimento ✅
4. cliente_sexo ✅
5. cliente_matricula ✅
6. cliente_renda ✅
7. valor_financiado ✅
8. valor_liberado ✅
9. valor_parcela ✅

### P: Preciso mudar muito código?
**R**: Pouco! Basicamente:
- Antes de SAVE: encripta
- Depois de LOAD: decripta
- Resto continua igual

---

## 📌 RESUMO FINAL

**Encriptação = Transformar dados legíveis em ilegíveis**

```
SEM: 12345678900     (Perigoso! Qualquer um vê)
COM: $2a$12$x9K2L... (Seguro! Só código consegue ler)
```

**Vai funcionar assim:**

1. ✅ Você entra com dados normalmente
2. ✅ Backend ENCRIPTA antes de salvar
3. ✅ Banco armazena dados ilegíveis
4. ✅ Backend DECRIPTA quando precisa ler
5. ✅ Você vê dados normais novamente
6. ✅ BACEN/LGPD fica feliz (dados protegidos)

---

## ✅ Pronto para começar?

Quer que eu:
- [ ] Crie o `EncryptionService.ts`?
- [ ] Mostre o código exemplo?
- [ ] Prepare a migration?
- [ ] Tudo junto?

Avisa! 🚀
