# 📋 CONFORMIDADE DADOS - PASSO 1: Auditoria & Classificação

**Data**: 25 de Novembro de 2025  
**Status**: 🔴 Não Iniciado  
**Timeline**: 1-2 semanas  
**Custo**: R$ 0,00 (você faz)

---

## 🎯 **OBJETIVO DO PASSO 1**

✅ Mapear TODOS os dados da plataforma  
✅ Classificar por nível de sensibilidade  
✅ Identificar dados PII (Personally Identifiable Info)  
✅ Documentar fluxos de dados  
✅ Criar matriz de conformidade  
✅ Priorizar próximas ações  

---

## 📊 **CHECKLIST - AUDITORIA DE DADOS**

### **1.1 - Auditoria: Banco de Dados**

Rode esses comandos para mapear TUDO:

```bash
# 1. Conectar ao PostgreSQL
psql -h 192.168.8.149 -U postgres -d airflow_treynor

# 2. Listar TODAS as tabelas
\dt

# 3. Para CADA tabela, listar colunas:
\d nome_da_tabela

# 4. Exportar schema completo (salvar em arquivo):
pg_dump -h 192.168.8.149 -U postgres -d airflow_treynor \
  --schema-only > schema-backup.sql
```

**Resultado esperado**: Lista completa de tabelas e colunas

```sql
-- Exemplo de saída (copie e adapte para sua DB):
-- Tabelas principais que você provavelmente tem:
-- - clients / customers / users
-- - contracts / proposals
-- - transactions / payments
-- - bank_accounts / financial_data
-- - audit_logs (criar depois)
```

---

### **1.2 - Auditoria: Código-Fonte**

Identifique onde dados sensíveis estão sendo processados:

```bash
# 1. Buscar por campos sensíveis no código
grep -r "cpf\|cnpj\|password\|email\|phone\|bank" \
  --include="*.ts" --include="*.js" src/ server/

# 2. Buscar por dados em plain text
grep -r "INSERT INTO\|SELECT.*FROM" \
  --include="*.ts" --include="*.js" src/ server/ | \
  grep -i "cpf\|password\|secret"

# 3. Identificar queries SQL vulneráveis
grep -r "SELECT.*\+" --include="*.ts" --include="*.js" src/

# 4. Buscar por console.log de dados sensíveis (ERRADO!)
grep -r "console.log.*cpf\|console.log.*password" \
  --include="*.ts" --include="*.js" src/
```

**O que procurar:**
- ❌ Senhas em logs
- ❌ CPF/CNPJ em plaintext
- ❌ Dados bancários expostos
- ❌ Email/telefone sem validação
- ❌ Concatenação de strings em SQL

---

### **1.3 - Auditoria: Arquivos & Logs**

```bash
# 1. Verificar logs históricos
ls -lah server/logs/
ls -lah /var/log/

# 2. Procurar por dados em logs
grep -i "cpf\|password\|secret" server/logs/* 2>/dev/null

# 3. Verificar arquivos temporários
ls -lah /tmp/ | grep -i delta

# 4. Verificar backups inseguros
find . -name "*.sql" -o -name "*.dump" -o -name "*backup*"
```

---

## 📝 **CLASSIFICAÇÃO DE DADOS**

### **2.1 - Matriz de Classificação**

Crie uma tabela assim (ou copie para arquivo):

```
┌─────────────────────────────────────────────────────────────────────┐
│ CLASSIFICAÇÃO DE DADOS - Delta Navigator                            │
├───────────┬──────────────────┬─────────┬──────────┬─────────────────┤
│ Campo     │ Tabela           │ Tipo    │ Sensível │ Conformidade    │
├───────────┼──────────────────┼─────────┼──────────┼─────────────────┤
│ cpf       │ clients          │ PII     │ ⭐⭐⭐⭐⭐│ LGPD + BACEN    │
│ cnpj      │ clients          │ PII     │ ⭐⭐⭐⭐⭐│ LGPD + BACEN    │
│ email     │ clients          │ PII     │ ⭐⭐⭐⭐  │ LGPD            │
│ phone     │ clients          │ PII     │ ⭐⭐⭐⭐  │ LGPD            │
│ address   │ clients          │ PII     │ ⭐⭐⭐   │ LGPD            │
│ password  │ auth.users       │ Secret  │ ⭐⭐⭐⭐⭐│ Crítico         │
│ bank_acc  │ bank_accounts    │ PII     │ ⭐⭐⭐⭐⭐│ LGPD + BACEN    │
│ bank_code │ bank_accounts    │ PII     │ ⭐⭐⭐⭐  │ BACEN           │
│ amount    │ transactions     │ Sensível│ ⭐⭐⭐   │ Auditoria       │
│ name      │ clients          │ PII     │ ⭐⭐⭐   │ LGPD            │
└───────────┴──────────────────┴─────────┴──────────┴─────────────────┘

Legenda:
⭐⭐⭐⭐⭐ = CRÍTICO (encriptar agora)
⭐⭐⭐⭐  = ALTO (encriptar este mês)
⭐⭐⭐   = MÉDIO (encriptar próximo mês)
```

---

### **2.2 - Criar Documento de Classificação**

Crie arquivo: `DATA_CLASSIFICATION_MATRIX.md`

```markdown
# 🏷️ Matriz de Classificação de Dados

## CONFIDENTIAL (Máximo Sigilo)

| Campo | Tabela | Por quê | Ação |
|-------|--------|---------|------|
| CPF | clients | Identidade, PII | Encriptar AES-256 |
| CNPJ | clients | Identidade, PII | Encriptar AES-256 |
| Password | auth.users | Crítico | Hash bcrypt |
| Bank Account | bank_accounts | Financeiro | Encriptar AES-256 |
| Bank Code | bank_accounts | Financeiro | Encriptar AES-256 |

## INTERNAL (Uso Interno)

| Campo | Tabela | Por quê | Ação |
|-------|--------|---------|------|
| Email | clients | PII | Criptografar ou mascarar |
| Phone | clients | PII | Criptografar |
| Contract ID | contracts | Negócio | Nenhum (público) |

## PUBLIC (Sem Restrição)

| Campo | Tabela | Por quê | Ação |
|-------|--------|---------|------|
| Contract Status | contracts | Status | Sem proteção |
| Transaction Amount | transactions | Auditoria | Log apenas |

---

## Regras de Acesso

### CONFIDENTIAL
- Apenas backend pode acessar
- Requer auditoria
- Logs criptografados

### INTERNAL  
- Backend + Admin podem acessar
- Mascarar em logs

### PUBLIC
- Qualquer pessoa autorizada
- Sem restrição especial
```

---

## 🔍 **MAPEAMENTO DE FLUXOS DE DADOS**

### **3.1 - Criar Diagrama de Fluxos**

```
┌──────────────────────────────────────────────────────────────────┐
│                    FLUXO DE DADOS - Delta Navigator               │
├──────────────────────────────────────────────────────────────────┤

1️⃣ ENTRADA (Frontend → Backend)
   Frontend (Vite)
        ↓ HTTPS (TLS 1.2+)
   NGINX (reverse proxy, WAF)
        ↓
   Backend API (Node.js)
        ↓
   Validação de entrada (sanitize, validate)
   
2️⃣ PROCESSAMENTO (Backend)
   Backend recebe dados
        ↓
   Aplica lógica de negócio
        ↓
   Encripta dados sensíveis (AES-256-GCM)
        ↓
   Valida contra regras LGPD/BACEN
        ↓
   
3️⃣ ARMAZENAMENTO (DB)
   PostgreSQL
        ↓ Dados em repouso
   cpf_encrypted (ciphertext)
   cpf_iv (vector)
   cpf_auth_tag (autenticação)
        ↓
   
4️⃣ AUDITORIA (Logs)
   Trigger PostgreSQL
        ↓
   Audit Log Table (quem fez, quando, o quê)
        ↓
   ELK Stack (Elasticsearch)
        ↓
   Kibana Dashboard
   
5️⃣ SAÍDA (DB → Frontend)
   PostgreSQL
        ↓ Query
   Backend (descriptografa se necessário)
        ↓
   Frontend (HTTPS)
        ↓
   Usuário vê dados mascarados: CPF "***.***.***-**"
```

---

### **3.2 - Documentar Fluxos por Serviço**

```markdown
## Fluxo: Criação de Cliente

1. **Frontend** → Usuario preenche formulário (nome, cpf, email, phone)
2. **HTTPS** → Transmissão criptografada
3. **NGINX** → Valida origem, rate limiting
4. **Backend-SQL** → 
   - Valida campos (sanitize)
   - Verifica duplicatas (hash de cpf)
   - Encripta: cpf, phone (AES-256)
   - Deixa plaintext: name, email (por enquanto)
5. **PostgreSQL** →
   - INSERT INTO clients (name, cpf_encrypted, cpf_iv, cpf_auth_tag, ...)
   - TRIGGER audit_clients → INSERT INTO audit_logs
6. **Vault** → Token de session salvo em Vault
7. **ELK** → Log: "User 123 created client with CPF [MASKED]"
8. **Frontend** → Mostra: "Cliente criado com sucesso"

---

## Fluxo: Consulta de Dados

1. Frontend → GET /api/clients/:id
2. Backend → SELECT * FROM clients WHERE id = :id
3. Backend → Descriptografa CPF (usando master key do Vault)
4. Backend → Mascara CPF na resposta: "***.***.***-**"
5. Frontend → Mostra ao usuário
6. Audit Log → "User 456 accessed client 123 PII"
```

---

## 📋 **CHECKLIST PRÁTICO**

### **SEMANA 1: Auditoria Completa**

```bash
# DIA 1-2: Mapeamento DB

# 1. Conectar ao seu banco
psql -h 192.168.8.149 -U postgres -d airflow_treynor

# 2. Listar todas as tabelas
SELECT table_name FROM information_schema.tables 
WHERE table_schema='public' ORDER BY table_name;

# 3. Para CADA tabela, listar campos
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'clients';

# 4. Salvar resultado em arquivo
\o tables-mapping.txt
SELECT table_name FROM information_schema.tables 
WHERE table_schema='public';
\o

# DIA 3-4: Auditoria de Código

grep -r "cpf\|cnpj\|password\|email\|phone" \
  --include="*.ts" --include="*.js" src/ > code-audit.txt

# DIA 5: Classificação

# Criar arquivo DATA_CLASSIFICATION_MATRIX.md (veja acima)

# DIA 6-7: Documentação

# Criar arquivo DATA_FLOWS.md com diagramas
```

---

### **SEMANA 2: Documento Final**

```markdown
# 📊 Resultado da Auditoria - Delta Navigator

## Tabelas Encontradas (8 total)

1. **clients** (12 colunas)
   - ✅ CPF, CNPJ (precisam encriptar)
   - ✅ Email, Phone (precisam encriptar)
   - ✅ Name, Address (sem restrição)

2. **contracts** (10 colunas)
   - ✅ Contract_id (sem restrição)
   - ✅ Amount (auditoria)

3. **transactions** (15 colunas)
   - ✅ Transaction_id (sem restrição)
   - ✅ Amount (auditoria)

4. **bank_accounts** (8 colunas)
   - ✅ Bank Account (CRÍTICO - encriptar)
   - ✅ Bank Code (CRÍTICO - encriptar)

5. **auth.users** (7 colunas)
   - ✅ Email (já criptografado?)
   - ✅ Password (já hashed com bcrypt?)

6. **audit_logs** (CRIAR NOVA)

## Dados PII Identificados

| Campo | Tabela | Tipo | Ação |
|-------|--------|------|------|
| cpf | clients | PII | Encriptar com AES-256 |
| cnpj | clients | PII | Encriptar com AES-256 |
| email | clients | PII | Encriptar com AES-256 |
| phone | clients | PII | Encriptar com AES-256 |
| bank_account | bank_accounts | PII | Encriptar com AES-256 |

## Próximas Ações

1. ✅ Passo 1 concluído: Auditoria
2. 🔄 Passo 2: Encriptação
3. 🔄 Passo 3: Audit Log
4. 🔄 Passo 4: LGPD
5. 🔄 Passo 5: BACEN
6. 🔄 Passo 6: Governança
```

---

## 🎬 **COMECE AGORA**

### **Tarefa 1: Conectar ao DB e Mapear**

```bash
# Abra terminal
psql -h 192.168.8.149 -U postgres -d airflow_treynor

# Digite:
\dt

# Copie a saída aqui:
# _______________________
# (Cole a lista de tabelas)
# _______________________
```

### **Tarefa 2: Para CADA tabela, rode:**

```bash
\d clients
\d contracts
\d transactions
\d bank_accounts
\d (outras tabelas)
```

### **Tarefa 3: Crie arquivo `DATA_CLASSIFICATION_MATRIX.md`**

(Use template acima)

### **Tarefa 4: Crie arquivo `DATA_FLOWS.md`**

(Use diagrama acima)

---

## 📊 **Resultado Esperado (Final do Passo 1)**

```
✅ DATA_CLASSIFICATION_MATRIX.md
   └─ Lista de TODAS as tabelas
   └─ Cada campo classificado (PII, Secret, etc)
   └─ Ações de conformidade por campo

✅ DATA_FLOWS.md
   └─ Diagrama fluxo de dados
   └─ Fluxo por serviço
   └─ Identificação de pontos críticos

✅ AUDIT_REPORT.txt
   └─ Lista de campos sensíveis encontrados
   └─ Prioridades de encriptação
   └─ Timeline de implementação

Status: 🟢 PASSO 1 PRONTO
Próximo: PASSO 2 - Criptografia de Dados
```

---

## 📞 **Dúvidas Comuns**

**P: Preciso encriptar TUDO?**  
R: Não. Apenas PII (CPF, CNPJ, Email, Phone, Bank Account). Dados públicos não precisam.

**P: E dados que já estão em plaintext no DB?**  
R: Vamos fazer migração no Passo 2 (script automático).

**P: E senhas de usuário?**  
R: Devem estar com bcrypt hash (não encriptação reversível).

**P: Qual a diferença entre hash e encriptação?**  
R: Hash = uma via (não recupera). Encriptação = reversível (com chave correta).

---

**Tempo Estimado**: 7-10 dias  
**Custo**: R$ 0  
**Complexidade**: 🟢 Baixa  

**Próximo Passo**: Assim que terminar, avançamos para o **PASSO 2: Criptografia de Dados em Repouso**
