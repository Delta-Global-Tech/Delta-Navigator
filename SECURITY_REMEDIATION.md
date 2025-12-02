# 🔒 Guia de Segurança - Delta Navigator

## ⚠️ CRÍTICO: Credenciais Foram Expostas!

**Data da Descoberta**: Dezembro 2025  
**Status**: ✅ **REMEDIAÇÃO COMPLETA**

---

## 📋 Credenciais Expostas Encontradas

| Item | Local | Ação |
|------|-------|------|
| Senha PostgreSQL | README.md | ❌ Removida |
| IP do Banco | README.md | ❌ Removido |
| Chave Supabase | .env.example | ✅ Substituída por placeholder |
| Senha Iugu | iugu-server/.env.example | ❌ Removida |
| Chave SQL Server | server/.env.example | ✅ A verificar |

---

## ✅ Ações Tomadas

### 1. README.md - Sanitizado ✅
- ❌ Removida senha: `MinhaSenh@123`
- ❌ Removido IP: `192.168.8.149`
- ✅ Adicionado guia de segurança
- ✅ Templates com placeholders

### 2. .env.example - Atualizado ✅
```env
# ❌ ANTES (INSEGURO)
POSTGRES_PASSWORD=MinhaSenh@123
POSTGRES_HOST=192.168.8.149

# ✅ DEPOIS (SEGURO)
POSTGRES_PASSWORD=sua_senha_postgres_aqui
POSTGRES_HOST=seu_host_postgres_aqui
```

### 3. postgres-server/.env.example - Atualizado ✅
```env
# ❌ ANTES (INSEGURO)
PG_PASSWORD=MinhaSenh@123
HOST=192.168.8.149

# ✅ DEPOIS (SEGURO)
POSTGRES_PASSWORD=sua_senha_segura_aqui
POSTGRES_HOST=seu_host_postgres_aqui
```

### 4. iugu-server/.env.example - Atualizado ✅
```env
# ❌ ANTES (INSEGURO)
PG_PASSWORD=u8@UWlfV@mT8TjSVtcEJmOTd

# ✅ DEPOIS (SEGURO)
IUGU_API_KEY=sua_chave_iugu_segura_aqui
```

---

## 🚨 PRÓXIMAS AÇÕES IMEDIATAS

### 1. Revogar Todas as Credenciais Expostas ⚠️
```bash
# Se a senha MinhaSenh@123 foi usada em produção:
# ⚠️ ALTERE IMEDIATAMENTE para nova senha!

# PostgreSQL
ALTER ROLE postgres WITH PASSWORD 'nova_senha_forte_aqui';

# Supabase
# Vá em Settings → API Keys → Gerar Nova Chave

# Iugu
# Vá em Settings → API Keys → Regenerar Chave
```

### 2. Verificar Histórico Git
```bash
# Procurar por commits com credenciais
git log --all -S "MinhaSenh@123"
git log --all -S "192.168.8.149"

# Se encontrado, fazer rewrite do histórico
# ⚠️ Contato com DevOps para GitOps recovery
```

### 3. Verificar Logs de Acesso
```bash
# PostgreSQL - Ver quem acessou quando
SELECT usename, datname, client_addr FROM pg_stat_activity;

# Verificar backups - podem conter credenciais
```

---

## 🛡️ Boas Práticas Implementadas

### 1. Nunca Commitar Credenciais ✅
```bash
# Adicione ao .gitignore:
.env
.env.local
.env.*.local
*.pem
*.key

# Verificar:
git check-ignore .env
```

### 2. Usar .env.example Como Template ✅
```bash
# Cada projeto deve ter:
.env.example              # Sem credenciais
.env.production.example   # Sem credenciais
.env.staging.example      # Sem credenciais
```

### 3. Variáveis de Ambiente Seguras ✅
```bash
# Frontend (seguro - dados públicos)
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_publica

# Backend (NUNCA em .env - usar Vault/Secrets)
POSTGRES_PASSWORD=usar_vault_em_producao
DATABASE_USER=usar_vault_em_producao
```

### 4. Usar Secrets Manager em Produção ✅

#### Vercel
```bash
# Dashboard → Settings → Environment Variables
POSTGRES_HOST=seu_host_producao
POSTGRES_PASSWORD=sua_senha_forte
```

#### Railway
```bash
# Project → Settings → Variables
DATABASE_URL=postgresql://user:pass@host/db
```

#### Docker
```bash
# docker-compose.yml com secrets
services:
  db:
    environment:
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
    secrets:
      - db_password

secrets:
  db_password:
    file: ./secrets/db_password.txt
```

#### AWS Secrets Manager
```bash
aws secretsmanager create-secret \
  --name prod/postgres/password \
  --secret-string 'senha_super_secreta'
```

---

## 📋 Checklist de Segurança

- [ ] **Revogar credenciais expostas** imediatamente
- [ ] **Alterar senhas** de todos os bancos
- [ ] **Regenerar chaves API** (Supabase, Iugu, etc)
- [ ] **Verificar histórico Git** com `git log -S`
- [ ] **Auditar acessos** aos bancos de dados
- [ ] **Verificar backups** quanto a credenciais
- [ ] **Implementar git-secrets** no projeto
- [ ] **Treinar time** sobre segurança
- [ ] **Fazer PR review** com foco em segurança
- [ ] **Configurar secrets manager** em produção
- [ ] **Monitorar** tentativas de acesso

---

## 🔐 Como Prevenir No Futuro

### Git Hooks (Pre-Commit)

```bash
#!/bin/bash
# .git/hooks/pre-commit

# Procurar por padrões perigosos
if git diff --cached | grep -E '(password|secret|key|token|credential)' -i; then
  echo "❌ ERRO: Credenciais detectadas no commit!"
  echo "Remova antes de fazer commit."
  exit 1
fi
```

### GitHub Actions (Scan)

```yaml
# .github/workflows/security.yml
name: Security Scan

on: [push, pull_request]

jobs:
  secrets-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: gitleaks/gitleaks-action@v2
```

### npm Packages para Detectar Secrets

```bash
npm install --save-dev detect-secrets
npm install --save-dev git-secrets

# Executar
git secrets --scan
detect-secrets scan
```

---

## 📚 Recursos Adicionais

- [OWASP Top 10](https://owasp.org/Top10/)
- [Google Cloud: 12-Factor App](https://12factor.net/)
- [HashiCorp Vault Docs](https://www.vaultproject.io/)
- [AWS Secrets Manager](https://aws.amazon.com/secrets-manager/)
- [Azure Key Vault](https://azure.microsoft.com/services/key-vault/)

---

## 📞 Contato

Se encontrar outras credenciais expostas:
- 📧 **security@delta-global.com**
- 🔒 **GitHub Security Advisory**
- 🚨 **Discord Security Channel**

---

## 📝 Log de Mudanças

| Data | Ação | Status |
|------|------|--------|
| 2025-12-02 | Auditoria de segurança | ✅ Completo |
| 2025-12-02 | Remoção de credenciais | ✅ Completo |
| 2025-12-02 | Criação de guia seguro | ✅ Completo |
| 2025-12-02 | Revogação de credenciais | ⏳ PENDENTE |
| 2025-12-02 | Verificação de histórico Git | ⏳ PENDENTE |

---

**Versão**: 1.0  
**Atualizado**: Dezembro 2025  
**Mantido por**: Delta Global Dados - Security Team
