# 🔐 Configuração de Segurança - Delta Navigator

## ✅ Boas Práticas Implementadas

### 1. **Vault para Secrets**
- ✅ Todos os secrets estão armazenados em **HashiCorp Vault**
- ✅ **30 credenciais sensíveis** protegidas e centralizadas
- ✅ Acesso auditado e controlado

### 2. **.gitignore - Proteção de Commits**
```bash
# Nunca faz commit de .env com senhas
.env
.env.local
.env.*.local

# Mas permite .env.example como template
!.env.example
```

### 3. **Estrutura de Configuração**

#### Desenvolvimento Local
```
.env (LOCAL - NÃO COMMITAR)
├── Contém valores para desenvolvimento
├── Senhas reais para testes
└── .gitignore previne commits acidental
```

#### Produção
```
Vault (PRODUÇÃO)
├── Todos os secrets armazenados de forma segura
├── Docker pulls secrets do Vault automaticamente
└── .env não precisa de senhas (fallback only)
```

---

## 📊 Secrets Protegidos no Vault (30 total)

### Delta Navigator
- `secret/data/delta/postgres-*` (5 secrets)

### Backend PostgreSQL
- `secret/data/backend-postgres/*` (5 secrets)

### Extrato Server
- `secret/data/extrato/*` (5 secrets)

### Iugu Server
- `secret/data/iugu/*` (5 secrets)

### Contratos Server
- `secret/data/contratos/*` (5 secrets)

### SQL Server
- `secret/data/sqlserver/*` (5 secrets)

---

## 🔍 Verificar Secrets no Vault

```powershell
# Testar conexão com Vault
curl -H "X-Vault-Token: devtoken" http://localhost:8200/v1/sys/health

# Verificar um secret específico
curl -H "X-Vault-Token: devtoken" \
  http://localhost:8200/v1/secret/data/delta/postgres-password
```

---

## 🚀 Como Usar

### Desenvolvimento Local
1. Copie `.env.example` para `.env`
2. Preencha com seus valores locais
3. **NÃO COMMITE** - .gitignore protege

### Produção
1. Popule o Vault com seus secrets
2. Docker lê automaticamente do Vault
3. .env serve apenas como fallback

---

## 📝 Convenção de Nomes

Secrets no Vault seguem padrão:
```
secret/data/{serviço}/{variavel}

Exemplo:
secret/data/delta/postgres-password
secret/data/extrato/postgres-host
secret/data/iugu/postgres-port
```

---

## ⚠️ IMPORTANTE

- ✅ Nunca faça commit de `.env` com senhas
- ✅ Sempre use `.env.example` como template
- ✅ Senhas sensíveis devem estar apenas no Vault
- ✅ Em CI/CD, configure Vault como source de truth

---

## 🔗 Recursos

- Vault Documentation: https://www.vaultproject.io/docs
- GitHub - Ignoring Files: https://docs.github.com/en/get-started/getting-started-with-git/ignoring-files
- Best Practices: https://12factor.net/config
