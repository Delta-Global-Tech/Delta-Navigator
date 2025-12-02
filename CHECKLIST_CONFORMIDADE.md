# ✅ CHECKLIST DE CONFORMIDADE BACEN - Acompanhamento

**Data de Início**: 25 de Novembro de 2025  
**Data Target**: 25 de Março de 2026 (4 meses)  
**Status Geral**: 🔴 20% Completo

---

## 📊 RESUMO DE PROGRESSO

```
Segurança:        ██░░░░░░░░ 20%
Criptografia:     ░░░░░░░░░░  0%
Auditoria:        ███░░░░░░░ 30%
Governança:       ░░░░░░░░░░  0%
───────────────────────────────
TOTAL:            ██░░░░░░░░ 13%
```

---

## 🔒 **FASE 1: SEGURANÇA CRÍTICA (Semanas 1-4)**

### **1.1 Remover Credenciais Hardcoded**
- [ ] Auditoria completa de credenciais no código
- [ ] Criar AWS Secrets Manager account
- [ ] Implementar secrets.js service
- [ ] Atualizar server.js
- [ ] Atualizar postgres-server/server.js
- [ ] Atualizar extrato-server/server.js
- [ ] Atualizar contratos-server/server.js
- [ ] Atualizar iugu-server/server.js
- [ ] Remover arquivo .env
- [ ] Git add .gitignore + .env entry
- [ ] Commit e push
- [ ] Audit logs históricos do Git
- [ ] ✅ **VALIDAÇÃO**: `grep -r "password.*=" --include="*.js"` = empty

### **1.2 Ativar HTTPS/TLS**
- [ ] Gerar certificado Let's Encrypt
- [ ] Instalar certificados em /certs
- [ ] Configurar HTTPS em server.js
- [ ] Configurar HSTS header
- [ ] Configurar CSP header
- [ ] Testar com curl -I https://localhost:3001
- [ ] Testar redirecionamento HTTP → HTTPS
- [ ] Testar em SSL Labs (Grade A mínimo)
- [ ] Atualizar docker-compose
- [ ] Testar em Docker
- [ ] ✅ **VALIDAÇÃO**: `openssl s_client -connect localhost:3001` mostra certificado válido

### **1.3 Fechar CORS**
- [ ] Criar cors-config.ts
- [ ] Remover 'Access-Control-Allow-Origin: *'
- [ ] Listar domínios permitidos
- [ ] Adicionar localhost em dev
- [ ] Implementar callback de origem
- [ ] Testar origem permitida (✅)
- [ ] Testar origem não permitida (❌)
- [ ] Testar pre-flight OPTIONS
- [ ] ✅ **VALIDAÇÃO**: curl com origin: hacker.com = CORS error

### **1.4 Implementar RBAC Básico**
- [ ] Criar migrations de roles/permissions
- [ ] Inserir roles (super_admin, admin, editor, viewer)
- [ ] Inserir permissions granulares
- [ ] Vincular role_permissions
- [ ] Implementar PermissionGate component
- [ ] Implementar usePermissions hook
- [ ] Adicionar RLS no Supabase
- [ ] Testar acesso com viewer (sem write)
- [ ] Testar acesso com admin (com write)
- [ ] Testar acesso negado (fallback)
- [ ] ✅ **VALIDAÇÃO**: Admin cria, Viewer não consegue

### **1.5 Implementar Rate Limiting**
- [ ] npm install express-rate-limit
- [ ] Criar rate-limit.ts
- [ ] Configurar Redis connection
- [ ] apiLimiter (100 req/15min)
- [ ] authLimiter (5 login/15min)
- [ ] createLimiter (50 create/hora)
- [ ] Aplicar a /api/*
- [ ] Testar limit excedido (429)
- [ ] Testar skip para /health
- [ ] ✅ **VALIDAÇÃO**: Fazer 101 requisições = 429 Too Many Requests

---

## 🔐 **FASE 2: CRIPTOGRAFIA (Semanas 5-8)**

### **2.1 Criptografia em Repouso (At-Rest)**
- [ ] Implementar EncryptionService (AES-256-GCM)
- [ ] Gerar master key (32 bytes)
- [ ] Armazenar master key em Secrets Manager
- [ ] Migrations: cpf_encrypted, cpf_iv, cpf_auth_tag
- [ ] Migrations: cnpj_encrypted, cnpj_iv, cnpj_auth_tag
- [ ] Implementar cpf_hash para busca (sem descriptografar)
- [ ] Criptografar dados existentes (script de migração)
- [ ] Testar encrypt/decrypt ciclo
- [ ] Testar que hash permite busca
- [ ] Testar que dados em DB são ciphertext
- [ ] Documentar backup de master key (em Safe)
- [ ] ✅ **VALIDAÇÃO**: SELECT cpf FROM clients = ciphertext, não plaintext

### **2.2 Criptografia de Dados Sensíveis**
- [ ] CPF encriptado ✅
- [ ] CNPJ encriptado ✅
- [ ] Senhas encriptadas ✅
- [ ] Tokens encriptados ✅
- [ ] Dados Bancários encriptados ✅
- [ ] Email encriptado (opcional) ⚠️
- [ ] Telefone encriptado (opcional) ⚠️
- [ ] ✅ **VALIDAÇÃO**: Zero dados sensíveis em plaintext no DB

### **2.3 Gestão de Chaves**
- [ ] Master key armazenada em Secrets Manager
- [ ] Acesso via IAM roles
- [ ] Audit log de acesso a master key
- [ ] Backup seguro de master key (encrypted)
- [ ] Procedure de recovery documentado
- [ ] Rotation de chaves (anualmente)
- [ ] ✅ **VALIDAÇÃO**: Só app pode ler master key via AWS SDK

### **2.4 TLS/SSL Avançado**
- [ ] Mutual TLS (mTLS) entre serviços internos
- [ ] Certificado para frontend → backend
- [ ] Certificado para backend → API externa
- [ ] Certificate pinning em mobile (se aplica)
- [ ] OCSP stapling ativado
- [ ] ✅ **VALIDAÇÃO**: SSL Labs Grade A+

---

## 📊 **FASE 3: AUDITORIA E LOGS (Semanas 9-12)**

### **3.1 Expandir Audit Log**
- [ ] Criar tabela audit_logs completa
- [ ] Campos: timestamp, user_id, action, resource, old_values, new_values
- [ ] Campos: ip_address, user_agent, session_id, request_id
- [ ] Campos: status, error_message, compliance_relevant
- [ ] RLS: apenas admins veem logs
- [ ] Trigger em tabela clients
- [ ] Trigger em tabela contracts
- [ ] Trigger em tabela auth.users
- [ ] Logar: CREATE, READ, UPDATE, DELETE
- [ ] Logar acesso a dados sensíveis
- [ ] ✅ **VALIDAÇÃO**: Toda operação tem entrada em audit_logs

### **3.2 Logs Imutáveis (Blockchain-like)**
- [ ] Implementar ImmutableAuditLog class
- [ ] Hash encadeado (previousHash)
- [ ] Tabela: immutable_audit_logs
- [ ] Função verifyIntegrity() para validar
- [ ] Replicação de logs para SIEM (Splunk/ELK)
- [ ] Retenção: 7 anos (Bacen requirement)
- [ ] Backup de logs (encriptado)
- [ ] ✅ **VALIDAÇÃO**: verifyIntegrity() = true (sem manipulação)

### **3.3 Data Lineage (Rastreamento de Origem)**
- [ ] Criar tabela data_lineage
- [ ] Documentar cada dataset
- [ ] Identificar source (API, DB, Upload)
- [ ] Documentar transformações
- [ ] Registrar owner de cada dataset
- [ ] Classificação (PUBLIC, INTERNAL, CONFIDENTIAL)
- [ ] Período de retenção
- [ ] Última modificação
- [ ] ✅ **VALIDAÇÃO**: Toda coluna tem lineage documentada

### **3.4 Data Quality Framework**
- [ ] Definir regras por tabela/campo
- [ ] Regra NOT_NULL
- [ ] Regra UNIQUE
- [ ] Regra FORMAT (regex/pattern)
- [ ] Regra RANGE (min/max)
- [ ] Validar em INSERT
- [ ] Validar em UPDATE
- [ ] Dashboard de qualidade
- [ ] Alertas para dados ruins
- [ ] Score de qualidade (0-100%)
- [ ] ✅ **VALIDAÇÃO**: 95%+ de qualidade em produção

### **3.5 Monitoramento em Tempo Real**
- [ ] Setup Prometheus
- [ ] Setup Grafana dashboards
- [ ] Alertas no Slack/Email
- [ ] Alertas de segurança
- [ ] Alertas de performance
- [ ] Alertas de dados ruins
- [ ] SLA: P1 < 1h, P2 < 4h, P3 < 24h
- [ ] Escalação automática
- [ ] ✅ **VALIDAÇÃO**: Alert enviado em < 5 minutos

---

## 📋 **FASE 4: GOVERNANÇA E CONFORMIDADE (Semanas 13-16)**

### **4.1 Política de Retenção de Dados**
- [ ] Documento formal assinado
- [ ] Tabela: data_retention_policies
- [ ] Clients: 5 anos pós-encerramento
- [ ] Transactions: 5 anos pós-vencimento
- [ ] Logs: 7 anos (Bacen)
- [ ] Testes: 90 dias (deletar automaticamente)
- [ ] Job agendado de retention cleanup
- [ ] Arquivo (S3) de dados expirados
- [ ] Backup de arquivo (7 anos)
- [ ] Notificação ao proprietário de dados
- [ ] ✅ **VALIDAÇÃO**: Job de retenção roda diariamente

### **4.2 DPIA (Data Protection Impact Assessment)**
- [ ] Documento formal (necessário LGPD)
- [ ] Descrição do processamento
- [ ] Avaliação de riscos
- [ ] Impacto financeiro/reputacional
- [ ] Medidas de mitigação
- [ ] Direitos do titular (acesso, exclusão, portabilidade)
- [ ] Assinado por DPO e Legal
- [ ] Revisão anual
- [ ] ✅ **VALIDAÇÃO**: DPIA aprovado por Legal

### **4.3 Classificação de Dados**
- [ ] Tabela data_classification
- [ ] Classificar TODOS os campos
- [ ] PUBLIC: menos sensível
- [ ] INTERNAL: dentro da empresa
- [ ] CONFIDENTIAL: máximo sigilo
- [ ] Marcar PII (Personally Identifiable Info)
- [ ] Requer consent? Marcar
- [ ] Requer encriptação? Marcar
- [ ] Middleware de enforcement
- [ ] Logs de acesso
- [ ] ✅ **VALIDAÇÃO**: 100% dos campos classificados

### **4.4 Direitos do Titular (LGPD)**
- [ ] ✅ **Acesso**: API de exportação de dados
- [ ] ✅ **Retificação**: Formulário de correção
- [ ] ✅ **Exclusão**: Processo de 30 dias
- [ ] ✅ **Portabilidade**: JSON/CSV download
- [ ] ✅ **Consentimento**: Rastreado
- [ ] ✅ **Direito a não ser perfilado**: Implementado
- [ ] Notificação de breach (72h)
- [ ] Responder DATA SUBJECT REQUEST (30 dias)
- [ ] ✅ **VALIDAÇÃO**: Usuário consegue baixar seus dados em JSON

### **4.5 Documentação de Conformidade**
- [ ] Registro de Processamento (LGPD)
- [ ] Matriz RACI (responsabilidades)
- [ ] Política de Segurança da Informação
- [ ] Plano de Disaster Recovery (DRP)
- [ ] Plano de Continuidade de Negócios (BCP)
- [ ] Guia de Operação e Runbooks
- [ ] Matriz de Incidentes
- [ ] Contato do DPO publicado
- [ ] ✅ **VALIDAÇÃO**: Documentação completa e versioned

### **4.6 DPO (Data Protection Officer) - LGPD**
- [ ] Designação formal
- [ ] Email: dpo@delta-navigator.com
- [ ] Telefone publicado
- [ ] Acesso irrestrito a dados
- [ ] Reporta para C-level
- [ ] Independência (não pode ser demitido por regulação)
- [ ] Treinamento em LGPD
- [ ] ✅ **VALIDAÇÃO**: DPO designado formalmente

---

## 🧪 **TESTES E VALIDAÇÃO**

### **Testes de Segurança**
- [ ] SAST (Código estático): Veracode/SonarQube
- [ ] DAST (Dinâmico): OWASP ZAP
- [ ] SCA (Dependências): npm audit
- [ ] Teste de Penetração: Contratado (anual)
- [ ] Teste de Integridade de Logs
- [ ] Teste de Failover/Disaster Recovery
- [ ] ✅ **VALIDAÇÃO**: 0 vulnerabilidades High/Critical

### **Testes de Conformidade**
- [ ] Auditoria interna BACEN
- [ ] Auditoria interna LGPD
- [ ] Auditoria externa (recomendado)
- [ ] Certificação SOC 2 Type II
- [ ] ISO 27001 (opcional)
- [ ] ✅ **VALIDAÇÃO**: Auditoria externa aprovada

### **Testes de Performance**
- [ ] Load test (1000 concurrent users)
- [ ] Stress test (até breaking point)
- [ ] Endurance test (24h de carga)
- [ ] Teste de latência (p95 < 500ms)
- [ ] ✅ **VALIDAÇÃO**: SLA: 99.99% uptime

---

## 📞 **SINAIS DE ÊXITO**

### ✅ Você saberá que completou quando:

```
☑️ SEGURANÇA
  ✓ 0 credenciais em código
  ✓ HTTPS/TLS 1.2+ em todas as APIs
  ✓ CORS restritivo implementado
  ✓ RBAC granular em produção
  ✓ Rate limiting protegendo APIs
  ✓ Score CVSS < 4.0 (Baixo)

☑️ CRIPTOGRAFIA
  ✓ AES-256 para dados sensíveis
  ✓ Master key em Secrets Manager
  ✓ Todos campos PII encriptados
  ✓ Zero dados plaintext no DB
  ✓ Testes de encrypt/decrypt passando

☑️ AUDITORIA
  ✓ Audit log 100% de operações
  ✓ Logs imutáveis e replicados
  ✓ Data lineage completa
  ✓ Quality score > 95%
  ✓ Alertas em tempo real funcionando

☑️ GOVERNANÇA
  ✓ Política de retenção em vigor
  ✓ DPIA assinado e aprovado
  ✓ Classificação de dados 100%
  ✓ Direitos do titular implementados
  ✓ DPO nomeado e ativo

☑️ COMPLIANCE
  ✓ Auditoria BACEN aprovada
  ✓ LGPD compliance certificado
  ✓ Documentação completa
  ✓ Testes de penetração limpo
  ✓ SOC 2 Type II certificado
```

---

## 📈 **MÉTRICAS DE ACOMPANHAMENTO (Atualizar Semanalmente)**

### **Semana 1-4: Segurança**

| Data | Segurança | CORS | RBAC | Rate Limit | Status |
|------|-----------|------|------|------------|--------|
| Nov 25 | 20% | ❌ | ❌ | ❌ | 🔴 Init |
| Dec 2 | 40% | ✅ | 30% | ❌ | 🟡 Progr |
| Dec 9 | 60% | ✅ | 60% | 30% | 🟡 Progr |
| Dec 16 | 80% | ✅ | ✅ | ✅ | 🟢 Done |

### **Semana 5-8: Criptografia**

| Data | Encrypt | Master Key | TLS | Status |
|------|---------|-----------|-----|--------|
| Dec 23 | 20% | 10% | ✅ | 🟡 Progr |
| Dec 30 | 50% | 40% | ✅ | 🟡 Progr |
| Jan 6 | 80% | ✅ | ✅ | 🟢 Done |
| Jan 13 | ✅ | ✅ | ✅ | ✅ |

---

## 🚨 **BLOCKERS / IMPEDIMENTOS**

- [ ] Budget aprovado?
- [ ] Resources alocados?
- [ ] Dependência externa (Bacen, Auditores)?
- [ ] Aprovação Legal?
- [ ] Aprovação Infra/Devops?

---

## 📞 **PRÓXIMA AÇÃO**

**👉 AGORA: Execute a auditoria de credenciais (PASSO 1 do GUIA_IMPLEMENTACAO_PRATICA.md)**

```bash
grep -r "password\|secret\|api_key" --include="*.js" --include="*.ts" \
  --include="*.json" --exclude-dir=node_modules .
```

---

**Atualizado**: 25 de Novembro de 2025  
**Responsável**: [SEU NOME]  
**Email**: [seu.email@delta-navigator.com]
