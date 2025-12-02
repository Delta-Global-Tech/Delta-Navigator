# 💻 VAULT - Exemplos Práticos de Uso

**Data**: 25 de Novembro de 2025  
**Objetivo**: Aprender na prática como usar o Vault

---

## 📚 EXEMPLO 1: Ler um Secret (Desenvolvimento)

### **Cenário**: Você está desenvolvendo e precisa da senha do banco

**ANTES (Errado):**

```javascript
// ❌ Senha em arquivo
const password = "minha_senha_123";
const client = new Pool({
  host: '192.168.8.149',
  password: password
});
```

**AGORA (Certo com Vault):**

```javascript
// ✅ Senha do Vault
const axios = require('axios');

async function connectToDatabase() {
  const vaultAddr = process.env.VAULT_ADDR || 'http://vault:8200';
  const vaultToken = process.env.VAULT_TOKEN || 'devtoken';
  
  // 1. Lê password do Vault
  const secretResponse = await axios.get(
    `${vaultAddr}/v1/secret/data/delta/postgres-password`,
    {
      headers: { 'X-Vault-Token': vaultToken }
    }
  );
  
  // 2. Extrai a senha
  const password = secretResponse.data.data.data.value;
  
  // 3. Conecta ao banco
  const client = new Pool({
    host: '192.168.8.149',
    password: password
  });
  
  console.log('✅ Conectado ao banco com sucesso');
  return client;
}

// Usar
const db = await connectToDatabase();
```

**Resultado:**
- ✅ Senha nunca fica em arquivo
- ✅ Criptografada no Vault
- ✅ Auditada quando acessada
- ✅ Fácil rotacionar sem mudar código

---

## 📚 EXEMPLO 2: Mudar Senha (Rotation)

### **Cenário**: Você descobriu que alguém pode ter visto a senha do banco

**SEM Vault (Ruim):**

```
1. Mudar senha no PostgreSQL
2. Editar 6 arquivos .env
3. Fazer git commit (PERIGOSO se vazar!)
4. Fazer deploy em todos os serviços
5. Reiniciar todos os containers
6. Tempo total: 30 minutos, 3 serviços caem temporariamente
```

**COM Vault (Bom):**

```bash
# 1. Mude a senha no Vault (10 segundos)
vault kv put secret/data/delta/postgres-password value="nova_senha_super_segura"

# 2. Pronto! Na próxima requisição, o backend pega a nova senha automaticamente
# Tempo: 10 segundos
# Downtime: ZERO
# Serviços: Continuam rodando
```

**Código backend (automático):**

```javascript
// A cada requisição, o backend refaz a conexão
async function getDbConnection() {
  const password = await vault.read('secret/data/delta/postgres-password');
  // Se mudou no Vault, pega a nova aqui
  
  return new Pool({
    host: '192.168.8.149',
    password: password // Sempre a versão mais nova
  });
}
```

---

## 📚 EXEMPLO 3: Auditoria (Rastreamento)

### **Cenário**: Bacen pergunta "Quem acessou dados sensíveis?"

**SEM Vault (Sem resposta):**

```
Bacen: "Quem acessou a senha do banco?"
Você: "Uh... não sei. Provavelmente 6 desenvolvedores?"
Bacen: ❌ REPROVADO
```

**COM Vault (Com resposta):**

```bash
# Ver logs de auditoria
vault audit list
vault read sys/audit

# Resultado típico:
# timestamp: 2025-11-25T14:30:15Z
# user: backend-sql
# action: read
# path: secret/data/delta/postgres-password
# status: success
# ip_address: 172.20.0.4

# Você responde ao Bacen:
# "backend-sql acessou postgres-password em 25/11 às 14:30:15 do IP 172.20.0.4"
```

✅ APROVADO

---

## 📚 EXEMPLO 4: Múltiplos Ambientes

### **Cenário**: Você tem desenvolvimento, teste e produção

**SEM Vault:**

```
.env.dev
├─ POSTGRES_PASSWORD=dev_password

.env.test
├─ POSTGRES_PASSWORD=test_password

.env.prod
├─ POSTGRES_PASSWORD=prod_password_super_secreto

PROBLEMA: Todos em arquivos diferentes! Fácil errar, fácil vazar!
```

**COM Vault:**

```
Vault Development
├─ secret/data/delta/postgres-password = dev_password

Vault Test
├─ secret/data/delta/postgres-password = test_password

Vault Production
├─ secret/data/delta/postgres-password = prod_password_super_secreto

BENEFÍCIO:
- Mesma estrutura em todos
- Cada ambiente isolado
- Nunca vaza código
- Fácil rotacionar por ambiente
```

---

## 📚 EXEMPLO 5: Integração com Backend

### **Cenário Real**: Backend-SQL conecta ao banco

**Código no `server.js`:**

```typescript
import axios from 'axios';
import { Pool } from 'pg';

class VaultClient {
  private vaultAddr: string;
  private vaultToken: string;
  
  constructor() {
    this.vaultAddr = process.env.VAULT_ADDR || 'http://vault:8200';
    this.vaultToken = process.env.VAULT_TOKEN || 'devtoken';
  }
  
  async getSecret(path: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.vaultAddr}/v1/${path}`,
        {
          headers: { 'X-Vault-Token': this.vaultToken }
        }
      );
      return response.data.data.data.value;
    } catch (error) {
      console.error(`❌ Erro ao acessar Vault: ${error.message}`);
      // Fallback para .env
      return process.env[path.split('/').pop()];
    }
  }
}

class DatabaseConnection {
  private vault: VaultClient;
  private pool: Pool;
  
  constructor() {
    this.vault = new VaultClient();
  }
  
  async connect(): Promise<void> {
    try {
      // Ler credenciais do Vault
      const host = await this.vault.getSecret('secret/data/delta/postgres-host');
      const port = await this.vault.getSecret('secret/data/delta/postgres-port');
      const db = await this.vault.getSecret('secret/data/delta/postgres-db');
      const user = await this.vault.getSecret('secret/data/delta/postgres-user');
      const password = await this.vault.getSecret('secret/data/delta/postgres-password');
      
      // Conectar ao banco
      this.pool = new Pool({
        host: host || '192.168.8.149',
        port: parseInt(port) || 5432,
        database: db,
        user: user,
        password: password,
      });
      
      // Testar conexão
      const client = await this.pool.connect();
      console.log('✅ Conectado ao banco via Vault');
      client.release();
      
    } catch (error) {
      console.error('❌ Erro ao conectar:', error);
      throw error;
    }
  }
  
  async query(sql: string, params?: any[]) {
    return this.pool.query(sql, params);
  }
}

// Usar em server.js
const db = new DatabaseConnection();
await db.connect();

app.get('/api/data', async (req, res) => {
  const result = await db.query('SELECT * FROM clients LIMIT 10');
  res.json(result.rows);
});
```

---

## 📚 EXEMPLO 6: Testar Acesso a Secret

### **Teste Prático**: Verificar se backend consegue acessar Vault

**Passo 1: Testar diretamente**

```bash
# Terminal 1: Ver todos os secrets
export VAULT_ADDR='http://localhost:8200'
export VAULT_TOKEN='devtoken'
vault kv list secret/data/delta/
```

**Saída esperada:**
```
Keys
----
postgres-db
postgres-host
postgres-password
postgres-port
postgres-user
```

**Passo 2: Ler um secret específico**

```bash
vault kv get secret/data/delta/postgres-password
```

**Saída:**
```
=== Secret Path ===
secret/data/delta/postgres-password

=== Data ===
Key                Value
---                -----
postgres-password  [VALOR_AQUI]
```

**Passo 3: Testar via API do backend**

```bash
# Se backend está rodando na porta 3001
curl http://localhost:3001/api/vault/health

# Esperado:
# {
#   "status": "healthy",
#   "vault_address": "http://vault:8200",
#   "vault_status": {
#     "initialized": true,
#     "sealed": false,
#     "version": "1.21.1"
#   }
# }
```

**Passo 4: Testar acesso a um secret específico**

```bash
# URL-encoded: "secret/data/delta/postgres-password" = "secret%2Fdata%2Fdelta%2Fpostgres-password"
curl "http://localhost:3001/api/vault/test-secret/secret%2Fdata%2Fdelta%2Fpostgres-password"

# Esperado:
# {
#   "status": "found",
#   "path": "secret/data/delta/postgres-password",
#   "data": {
#     "data": {"value": "[SENHA_AQUI]"},
#     "metadata": {
#       "created_time": "2025-11-25T13:51:35Z",
#       "version": 1
#     }
#   }
# }
```

---

## 📚 EXEMPLO 7: Backup & Restore

### **Cenário**: Você quer fazer backup dos secrets

**Fazer Backup:**

```bash
# 1. Entrar no container Vault
docker exec vault /bin/sh

# 2. Fazer snapshot
vault operator raft snapshot save /tmp/vault-backup.snap

# 3. Sair
exit

# 4. Copiar para host
docker cp vault:/tmp/vault-backup.snap ./vault-backup.snap

# 5. Verificar arquivo
ls -lh vault-backup.snap
# Deve estar encriptado e seguro
```

**Restaurar Backup (Se perder dados):**

```bash
# 1. Copiar arquivo para container
docker cp vault-backup.snap vault:/tmp/

# 2. Entrar no container
docker exec vault /bin/sh

# 3. Restaurar
vault operator raft snapshot restore /tmp/vault-backup.snap

# 4. Verificar se voltou
vault kv list secret/data/delta/

# Pronto! Todos os secrets estão de volta
```

---

## 📚 EXEMPLO 8: Erro Comum & Solução

### **Erro 1: "Vault is sealed"**

```bash
# Erro:
curl http://localhost:8200/v1/sys/health
# {"sealed":true, "error":"Vault is sealed"}

# Causa: Vault foi desligado ou reiniciado

# Solução:
vault operator unseal [recovery-key]

# OU reiniciar container:
docker restart vault
```

### **Erro 2: "Permission denied"**

```bash
# Erro ao tentar ler secret
vault kv get secret/data/delta/postgres-password
# Error reading secret/data/delta/postgres-password: Error making request: ...

# Causa: Token não tem permissão

# Solução:
# 1. Verificar token
echo $VAULT_TOKEN

# 2. Verificar se tem permissão
vault token lookup

# 3. Se não tem, usar outro token:
export VAULT_TOKEN='devtoken'
```

### **Erro 3: "Connection refused"**

```bash
# Erro:
curl http://localhost:8200/v1/sys/health
# Connection refused

# Causa: Vault não está rodando

# Solução:
# 1. Verificar se container existe
docker ps | grep vault

# 2. Se não existe, iniciar
docker-compose up -d vault

# 3. Se existe mas não responde
docker logs vault
docker restart vault
```

---

## 🎯 CHECKLIST DE USO

### **Você sabe**:

- [ ] Como ler um secret do Vault
- [ ] Como criar/atualizar um secret
- [ ] Como deletar um secret
- [ ] Como fazer backup do Vault
- [ ] Como restaurar do backup
- [ ] Como ver logs de auditoria
- [ ] Como verificar se Vault está saudável
- [ ] Como solucionar erros comuns

---

## 📞 COMANDOS MAIS USADOS

```bash
# Listar todos os secrets
vault kv list secret/data/

# Ver um secret
vault kv get secret/data/delta/postgres-password

# Criar/atualizar secret
vault kv put secret/data/delta/postgres-password value="nova_senha"

# Deletar secret
vault kv delete secret/data/delta/postgres-password

# Health check
curl http://localhost:8200/v1/sys/health

# Fazer backup
vault operator raft snapshot save backup.snap

# Ver token info
vault token lookup

# Ver permissões
vault token lookup -format=json | jq '.data.policies'
```

---

## ✅ CONCLUSÃO

Você agora tem um **Vault totalmente funcional** que:

✅ Armazena 30 secrets centralizadamente  
✅ Encripta com AES-256  
✅ Auditoria de acesso  
✅ Facilita rotação de senhas  
✅ Suporta fallback para .env  
✅ Pronto para produção  

**Próximo passo**: Encriptar dados em repouso no banco 🔐

