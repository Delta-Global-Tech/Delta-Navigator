# 📊 AUDITORIA DE DADOS - RESULTADO PASSO 1

**Data Execução**: 25 de Novembro de 2025  
**Banco**: airflow_treynor  
**Host**: 192.168.8.149  
**Status**: ✅ CONCLUÍDO

---

## 📋 TABELAS ENCONTRADAS (51 Total)

### **Tabelas do Airflow (43 tabelas)**

Estas são tabelas padrão do Airflow (workflow orchestration):

```
ab_permission              | Permissões do Airflow
ab_permission_view         | Permissões por view
ab_permission_view_role    | Roles de permissões
ab_register_user           | Usuários registrados
ab_role                    | Roles/papéis
ab_user                    | Usuários do Airflow
ab_user_role               | Associação user-role
ab_view_menu               | Menu do Airflow
alembic_version            | Versão de migrations
callback_request           | Callbacks de DAGs
celery_taskmeta            | Metadata de tasks Celery
celery_tasksetmeta         | Metadata de tasksets
connection                 | Conexões (DB, APIs)
dag                        | Definição de DAGs
dag_code                   | Código das DAGs
dag_owner_attributes       | Atributos de owners
dag_pickle                 | DAGs serializadas
dag_priority_parsing_request | Requisições de prioridade
dag_run                    | Execuções de DAGs
dag_run_note               | Notas de execuções
dag_schedule_dataset_alias_reference | Referências de aliases
dag_schedule_dataset_reference       | Referências de datasets
dag_tag                    | Tags de DAGs
dag_warning                | Avisos de DAGs
dagrun_dataset_event       | Eventos de datasets
dataset                    | Datasets
dataset_alias              | Aliases de datasets
dataset_alias_dataset      | Associação alias-dataset
dataset_alias_dataset_event | Eventos de aliases
dataset_dag_run_queue      | Fila de execução
dataset_event              | Eventos de datasets
import_error               | Erros de import
job                        | Jobs do Airflow
log                        | Logs de execução
log_template               | Templates de logs
rendered_task_instance_fields | Campos renderizados
serialized_dag             | DAGs serializadas
session                    | Sessões
sla_miss                   | SLA não atingidos
slot_pool                  | Pool de slots
task_fail                  | Falhas de tasks
task_instance              | Instâncias de tasks
task_instance_history      | Histórico de tasks
task_instance_note         | Notas de tasks
task_map                   | Mapeamento de tasks
task_outlet_dataset_reference | Referências de outlets
task_reschedule            | Re-agendamentos
trigger                    | Triggers
variable                   | Variáveis do Airflow
xcom                       | Cross-communication (dados entre tasks)
```

---

### **Tabelas de Negócio (1 tabela)**

```
fact_proposals_newcorban   | ⭐ TABELA IMPORTANTE
                           | Propostas/contratos
                           | Dados financeiros sensíveis
                           | REQUER AUDITORIA
```

---

## 🔍 ANÁLISE: O QUE É SENSÍVEL?

### **Tabelas com PII (Personally Identifiable Info)**

```
ab_user
├─ Usuários do Airflow
├─ Possivelmente: email, nome, senha
└─ Status: ⚠️ Verificar se tem dados sensíveis

ab_register_user
├─ Usuários registrados
├─ Possivelmente: email, telefone, nome
└─ Status: ⚠️ Verificar campos

connection
├─ Credenciais de conexão
├─ Possivelmente: senhas, tokens, URLs
└─ Status: 🔴 CRÍTICO - Pode ter secrets em plaintext
```

### **Tabelas com Dados Financeiros**

```
fact_proposals_newcorban ⭐ CRÍTICA
├─ Propostas/contratos
├─ Possivelmente: CPF, CNPJ, valores
├─ Possivelmente: Dados bancários
└─ Status: 🔴 CRÍTICO - Encriptar agora
```

### **Tabelas de Sistema (Baixo Risco)**

```
Todas as outras tabelas (43 tabelas do Airflow)
├─ Logs, execuções, workflows
├─ Sem dados pessoais diretos
└─ Status: 🟢 Baixo risco (monitorar logs)
```

---

## 📊 PRÓXIMO PASSO: INSPECIONAR TABELAS CRÍTICAS

Vamos ver a estrutura das tabelas importantes:

### **Tabela 1: fact_proposals_newcorban** (CRÍTICA)

```bash
# Descrever estrutura
\d fact_proposals_newcorban;
```

Quando rodar isto, procure por:
- CPF ❌ (Crítico)
- CNPJ ❌ (Crítico)
- Email ❌ (Crítico)
- Phone ❌ (Crítico)
- Bank Account ❌ (Crítico)
- Amount/Valor ⚠️ (Importante)

---

### **Tabela 2: ab_user** (IMPORTANTE)

```bash
\d ab_user;
```

Quando rodar isto, procure por:
- Password ❌ (Como está armazenado? Hash?)
- Email ⚠️ (Dados pessoais)
- Name ⚠️ (Dados pessoais)

---

### **Tabela 3: connection** (CRÍTICA)

```bash
\d connection;
```

Quando rodar isto, procure por:
- Password ❌ (Está em plaintext? 🚨)
- Login ❌ (Credenciais)
- Host ⚠️ (Pode revelar infraestrutura)

---

## 🎯 PLANO DE AÇÃO

```
✅ PASSO 1 (AGORA): Identificar tabelas
   └─ Encontradas: 51 tabelas
   └─ Crítica: fact_proposals_newcorban
   └─ Importante: ab_user, connection

🔄 PASSO 2 (PRÓXIMO): Inspecionar estrutura
   └─ Rodar \d para cada tabela crítica
   └─ Identificar campos sensíveis
   └─ Criar DATA_CLASSIFICATION.md

🔄 PASSO 3: Verificar dados em plaintext
   └─ Procurar senhas em connection
   └─ Verificar como password está armazenado em ab_user
   └─ Auditar fact_proposals_newcorban

🔄 PASSO 4: Documentação final
   └─ Criar AUDIT_REPORT.md
   └─ Listar campos a encriptar
   └─ Timeline de implementação
```

---

## 📝 RESUMO ACHADOS

```
Total de Tabelas: 51
├─ Tabelas Airflow: 43 (baixo risco)
├─ Tabelas Negócio: 1 (CRÍTICA)
└─ Status de Análise: ⚠️ INCOMPLETO (precisa inspecionar)

Tabelas Críticas Identificadas:
├─ 🔴 fact_proposals_newcorban (Propostas/Financeiro)
├─ 🔴 connection (Credenciais)
└─ 🟡 ab_user (Usuários)

Próximo Passo:
→ Descrever estrutura das 3 tabelas críticas
→ Identificar campos sensíveis específicos
→ Criar plano de encriptação
```

---

## ⚠️ OBSERVAÇÕES IMPORTANTES

1. **51 tabelas é MUITO** - A maioria é do Airflow
2. **Apenas 1 tabela parece ser "de negócio"** - `fact_proposals_newcorban`
3. **Dados sensíveis podem estar em:**
   - fact_proposals_newcorban (CPF, CNPJ, dados bancários)
   - connection (senhas de credenciais)
   - ab_user (senhas de usuários)
   - ab_register_user (dados pessoais)

4. **Próximas ações:**
   - Descrever as 3 tabelas críticas
   - Procurar por campos sensíveis específicos
   - Verificar se senhas estão em plaintext ou hash

---

## 📞 PRÓXIMAS PERGUNTAS PARA RESPONDER

1. **fact_proposals_newcorban tem quais colunas?**
   → Procurar por: cpf, cnpj, email, phone, bank_account, amount

2. **ab_user como armazena password?**
   → É plaintext? É bcrypt? É outro hash?

3. **connection table tem senhas em plaintext?**
   → 🚨 CRÍTICO SE SIM - precisa encriptar AGORA

4. **Há outros dados pessoais além dos listados?**
   → Endereço? Data de nascimento? Documentos?

---

**Status**: 🟡 **PARCIALMENTE COMPLETO**  
**Próximo**: Descrever as 3 tabelas críticas  
**Tempo Restante**: ~30 minutos

Vamos continuar? 🚀
