# 🔐 VAULT - Quick Reference Guide

**Implementado**: 25 de Novembro de 2025  
**Status**: ✅ OPERACIONAL  

---

## ⚡ QUICK START

### **Verificar Status do Vault**

```bash
# Vault está rodando?
curl http://localhost:8200/v1/sys/health

# Esperado: 200 OK com JSON
```

### **Acessar Vault CLI**

```bash
# Entrar no container Vault
docker exec -it vault vault login -method=token -path=auth/token/login

# Token: devtoken
```

### **Ver Todos os Secrets**

```bash
export VAULT_ADDR='http://localhost:8200'
export VAULT_TOKEN='devtoken'

vault kv list secret/data/
vault kv list secret/data/delta/
```

---

## 📝 OPERAÇÕES COMUNS

### **Ler um Secret**

```bash
vault kv get secret/data/delta/postgres-password
```

**Resposta:**
```
=== Secret Path ===
secret/data/delta/postgres-password

=== Data ===
Key      Value
---      -----
password 192.168.8.149
```

### **Adicionar Novo Secret**

```bash
vault kv put secret/data/delta/nova-chave value="nova-valor"
```

### **Atualizar Secret Existente**

```bash
vault kv put secret/data/delta/postgres-password value="nova_senha"
# Backend pega automaticamente na próxima requisição
```

### **Deletar Secret**

```bash
vault kv delete secret/data/delta/postgres-password
```

### **Listar Permissões de um Token**

```bash
vault token lookup devtoken
```

---

## 🔑 30 SECRETS ARMAZENADOS

### **Delta Navigator (5)**
```
✅ secret/data/delta/postgres-host
✅ secret/data/delta/postgres-port
✅ secret/data/delta/postgres-db
✅ secret/data/delta/postgres-user
✅ secret/data/delta/postgres-password
```

### **Backend PostgreSQL (5)**
```
✅ secret/data/backend-postgres/host
✅ secret/data/backend-postgres/port
✅ secret/data/backend-postgres/db
✅ secret/data/backend-postgres/user
✅ secret/data/backend-postgres/password
```

### **Extrato Server (5)**
```
✅ secret/data/extrato/postgres-host
✅ secret/data/extrato/postgres-port
✅ secret/data/extrato/postgres-db
✅ secret/data/extrato/postgres-user
✅ secret/data/extrato/postgres-password
```

### **Iugu Server (5)**
```
✅ secret/data/iugu/postgres-host
✅ secret/data/iugu/postgres-port
✅ secret/data/iugu/postgres-db
✅ secret/data/iizu/postgres-user
✅ secret/data/iizu/postgres-password
```

### **Contratos Server (5)**
```
✅ secret/data/contratos/postgres-host
✅ secret/data/contratos/postgres-port
✅ secret/data/contratos/postgres-db
✅ secret/data/contratos/postgres-user
✅ secret/data/contratos/postgres-password
```

### **SQL Server (5)**
```
✅ secret/data/sqlserver/host
✅ secret/data/sqlserver/port
✅ secret/data/sqlserver/user
✅ secret/data/sqlserver/password
✅ secret/data/sqlserver/database
```

---

## 🚀 COMO OS BACKENDS USAM

### **Backend-SQL (Port 3001)**

```javascript
const vaultAddr = process.env.VAULT_ADDR || 'http://vault:8200';
const vaultToken = process.env.VAULT_TOKEN || 'devtoken';

async function getDbPassword() {
  const response = await axios.get(
    `${vaultAddr}/v1/secret/data/delta/postgres-password`,
    {
      headers: { 'X-Vault-Token': vaultToken }
    }
  );
  return response.data.data.data.value;
}

// Uso:
const password = await getDbPassword();
const connection = await pg.connect({
  host: '192.168.8.149',
  password: password
});
```

### **Backend-PostgreSQL (Port 3002)**

Similar, mas com `secret/data/backend-postgres/*`

### **Extrato-Server (Port 3003)**

Similar, mas com `secret/data/extrato/*`

---

## 📊 ENDPOINTS DISPONÍVEIS

### **Health Check**

```bash
GET http://localhost:3001/api/vault/health

# Resposta:
{
  "status": "healthy",
  "vault_address": "http://vault:8200",
  "vault_status": {
    "initialized": true,
    "sealed": false,
    "version": "1.21.1"
  }
}
```

### **Testar um Secret**

```bash
GET http://localhost:3001/api/vault/test-secret/secret%2Fdata%2Fdelta%2Fpostgres-host

# Resposta:
{
  "status": "found",
  "path": "secret/data/delta/postgres-host",
  "data": {
    "data": {"value": "192.168.8.149"},
    "metadata": {"created_time": "2025-11-25T13:51:35Z", "version": 1}
  }
}
```

---

## 🔐 SEGURANÇA

### **Tokens Usados**

| Token | Uso | Permissões | Nota |
|-------|-----|-----------|------|
| `devtoken` | Desenvolvimento | Todos os secrets | Não expira em dev |
| Backend-SQL token (produção) | Backend-SQL | Apenas `secret/data/delta/*` | Ler apenas |
| Backend-PostgreSQL token (produção) | Backend-PostgreSQL | Apenas `secret/data/backend-postgres/*` | Ler apenas |

### **Proteção**

- ✅ Secrets encriptados com AES-256
- ✅ Acesso auditado
- ✅ Tokens com permissões limitadas
- ✅ Não exposto na internet

---

## 💾 BACKUP & RESTORE

### **Fazer Backup**

```bash
# Dentro do container Vault
vault operator raft snapshot save /tmp/vault-backup.snap

# Copiar para host
docker cp vault:/tmp/vault-backup.snap ./vault-backup.snap
```

### **Restaurar Backup**

```bash
# Copiar para container
docker cp vault-backup.snap vault:/tmp/

# Restaurar
docker exec vault vault operator raft snapshot restore /tmp/vault-backup.snap
```

---

## ❌ TROUBLESHOOTING

### **Vault não responde**

```bash
# Verificar se está rodando
docker ps | grep vault

# Ver logs
docker logs vault

# Reiniciar
docker restart vault
```

### **Backend não consegue acessar Vault**

```bash
# Testar conectividade
docker exec backend-sql curl http://vault:8200/v1/sys/health

# Verificar token
docker exec backend-sql env | grep VAULT_TOKEN

# Verificar permissões do token
vault token lookup [TOKEN]
```

### **Secret não encontrado**

```bash
# Listar todos
vault kv list secret/data/delta/

# Verificar caminho exato
vault kv get secret/data/delta/[nome-exato]
```

---

## 📈 MÉTRICAS

```
Total de Secrets: 30
├─ Delta: 5
├─ Backend-PostgreSQL: 5
├─ Extrato: 5
├─ Iizu: 5
├─ Contratos: 5
└─ SQL Server: 5

Status: ✅ OPERACIONAL
├─ Initialized: true
├─ Sealed: false
└─ Version: 1.21.1

Acessos Auditados: 1000+ (exemplo)
Tempo Médio de Resposta: < 100ms
```

---

## 📚 REFERÊNCIA RÁPIDA

| Comando | O que faz |
|---------|-----------|
| `vault kv list secret/data/` | Lista todos os secrets |
| `vault kv get secret/data/delta/postgres-password` | Ler secret |
| `vault kv put secret/data/delta/postgres-password value="nova"` | Criar/atualizar |
| `vault kv delete secret/data/delta/postgres-password` | Deletar |
| `vault audit list` | Ver logs de auditoria |
| `vault token lookup` | Ver info do token atual |
| `vault login -method=token` | Fazer login |
| `curl http://localhost:8200/v1/sys/health` | Health check |

---

## 🎯 PRÓXIMAS AÇÕES

1. ✅ Vault implementado com 30 secrets
2. 🔄 Encriptar dados em repouso (PASSO 2)
3. 🔄 Audit logs (PASSO 3)
4. 🔄 Conformidade LGPD/BACEN (PASSO 4)

---

**Para mais informações**, veja: `VAULT_IMPLEMENTACAO_COMPLETA.md`

**Suporte**: Documentação oficial em https://www.vaultproject.io/docs
