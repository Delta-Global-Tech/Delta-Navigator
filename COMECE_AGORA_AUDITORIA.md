# 🚀 COMECE AGORA - Auditoria de Dados (Tabela Única)

**Data**: 25 de Novembro de 2025  
**Tempo**: 10-15 minutos  
**Resultado**: Classificação de dados para `fact_proposals_newcorban`  

---

## ℹ️ CONTEXTO

Este microserviço usa **APENAS 1 tabela**:
- **Tabela**: `fact_proposals_newcorban`
- **Banco**: `airflow_treynor`
- **Host**: `192.168.8.149`

---

## ✅ PASSO A PASSO (Copie e Cole)

### **1️⃣ CONECTAR AO BANCO (2 min)**

Use Docker (já tem acesso):

```powershell
docker exec airflow2-postgres psql -U postgres -d airflow_treynor
```

Se conectou ✅, vamos pro próximo passo.

---

### **2️⃣ DESCREVER A TABELA (2 min)**

Digite no psql:

```sql
\d fact_proposals_newcorban
```

**Você verá 43 colunas**. Copie toda a saída.

---

### **3️⃣ EXPORTAR APENAS ESSA TABELA**

Saia do psql:

```sql
\q
```

Agora rode:

```bash
# Windows PowerShell
pg_dump -h 192.168.8.149 -U postgres -d airflow_treynor `
  --schema-only --table=fact_proposals_newcorban > schema-fact-proposals.sql
```

**Resultado**: Arquivo `schema-fact-proposals.sql` criado ✅

---

### **4️⃣ PROCURAR NO CÓDIGO-FONTE**

```bash
# Windows PowerShell
Get-ChildItem -Path "src", "server" -Recurse -Include "*.ts", "*.js" | 
  Select-String -Pattern "fact_proposals_newcorban|cliente_cpf|valor_financiado" | 
  Out-File code-audit.txt

# Mac/Linux
grep -r "fact_proposals_newcorban\|cliente_cpf\|valor_financiado" \
  --include="*.ts" --include="*.js" src/ server/ > code-audit.txt
```

---

## 📝 CRIAR ARQUIVO DE CLASSIFICAÇÃO

Crie novo arquivo: `DATA_CLASSIFICATION.md`

```markdown
# 🏷️ Classificação de Dados - Microserviço

## TABELA ÚNICA UTILIZADA

### Tabela: fact_proposals_newcorban

**43 Colunas Totais - Classificação Sensibilidade:**

#### 🔴 CRÍTICO - PII/Financial (ENCRIPTAR AGORA)
| Campo | Tipo | Risco | Ação |
|-------|------|-------|------|
| cliente_cpf | text | **CRÍTICO** | **Encriptar AES-256** |
| cliente_nome | text | PII | Encriptar AES-256 |
| cliente_nascimento | timestamp | PII | Encriptar AES-256 |
| cliente_sexo | text | PII | Encriptar AES-256 |
| cliente_matricula | text | Identificador | Encriptar AES-256 |
| cliente_renda | numeric | Financial | Encriptar AES-256 |
| valor_financiado | numeric | Financial | Encriptar AES-256 |
| valor_liberado | numeric | Financial | Encriptar AES-256 |
| valor_parcela | numeric | Financial | Encriptar AES-256 |

#### 🟡 IMPORTANTE - Audit/Status (Log + Proteção)
| Campo | Tipo | Risco | Ação |
|-------|------|-------|------|
| proposta_id | text | Identificador único | Não encriptar (chave) |
| status_nome | text | Operacional | Registrar em audit_logs |
| substatus | text | Operacional | Registrar em audit_logs |
| data_status | timestamp | Operacional | Registrar em audit_logs |
| prazo | integer | Operacional | Registrar em audit_logs |
| taxa | numeric | Financial | Registrar em audit_logs |
| created_at | timestamp | Metadata | Manter como está |
| collected_at | timestamp | Metadata | Manter como está |

#### 🟢 REFERÊNCIA - Identificadores (Sem Proteção)
| Campo | Tipo | Risco | Ação |
|-------|------|-------|------|
| cliente_id | (tipo) | Referência | Sem proteção |
| banco_id | (tipo) | Referência | Sem proteção |
| banco_nome | text | Referência | Sem proteção |
| produto_id | (tipo) | Referência | Sem proteção |
| produto_nome | text | Referência | Sem proteção |
| vendedor_id | (tipo) | Referência | Sem proteção |
| vendedor_nome | text | Referência | Sem proteção |
| equipe_id | (tipo) | Referência | Sem proteção |
| equipe_nome | text | Referência | Sem proteção |
| convenio_nome | text | Referência | Sem proteção |
| tabela_nome | text | Referência | Sem proteção |
| digitador_id | (tipo) | Referência | Sem proteção |
| digitador_nome | text | Referência | Sem proteção |
| origem | text | Referência | Sem proteção |
| tipo_cadastro | text | Referência | Sem proteção |
| observacao_manual | text | Operacional | Log se modificado |
| observacao_api | text | Operacional | Log se modificado |

---

## Resumo: Ação Imediata

### 🔴 ENCRIPTAR AGORA (9 campos)
1. cliente_cpf
2. cliente_nome
3. cliente_nascimento
4. cliente_sexo
5. cliente_matricula
6. cliente_renda
7. valor_financiado
8. valor_liberado
9. valor_parcela

### � CRIAR AUDIT LOG (para todas as operações)
- INSERT: Registrar proposta_id + usuario + timestamp
- UPDATE: Registrar campo modificado + valor_anterior + valor_novo
- DELETE: Registrar proposta_id + usuario + timestamp

---

## Próximo Passo

Após validar esta classificação, iniciamos **PASSO 2: Implementar Encriptação AES-256** apenas para esses 9 campos.
```

---

## 🎯 VERIFICAÇÃO FINAL

Após completar os 4 passos acima, você terá:

```
✅ schema-fact-proposals.sql - Schema da tabela única
✅ code-audit.txt - Como essa tabela é usada no código
✅ DATA_CLASSIFICATION.md - Classificação dos 43 campos
```

---

## 📞 RESPONDA ESTAS PERGUNTAS

1. **Quantos campos a tabela tem?** 
   → **43 campos**

2. **Qual é o campo mais crítico?**
   → **cliente_cpf** (PLAINTEXT - VIOLA LGPD)

3. **Você acessa essa tabela em qual microserviço?**
   → _____ (caminho do código)

4. **Como você usa cliente_cpf no código?**
   → Exemplo: Busca? Exibição? API response?

---

## ⏱️ TEMPO ESTIMADO

```
- Conectar ao BD: 2 min
- Descrever tabela: 2 min
- Exportar schema: 1 min
- Procurar no código: 3 min
- Validar classificação: 5 min

TOTAL: ~13 minutos ⏰
```

---

**Status**: 🟢 Pronto para começar  
**Próximo**: Após terminar, vamos direto para o **PASSO 2: Encriptação**

Vamos? 🚀
