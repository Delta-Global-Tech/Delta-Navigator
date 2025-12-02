# 🚀 FASE 1: Adicionar Vault ao Docker (Passo-a-Passo)

**Status**: ✅ PRONTO PARA EXECUTAR  
**Tempo estimado**: 10 minutos  
**Risco**: ⚠️ BAIXO (backup já feito, fallback automático)

---

## ✅ **Confirmado pelo Teste**

```
[OK] Docker funcionando
[OK] Docker Compose valido
[OK] Todos backends saudaveis
[OK] .env configurado
[OK] Pronto para Vault
```

Seu backup foi criado em: `docker-compose.yml.backup-20250125-HHMMSS`

---

## 🎯 **PASSO 1: Iniciar Vault (1 minuto)**

```powershell
# Ir para o diretorio do projeto
cd C:\Users\alexsandro.costa\Delta-Navigator

# Iniciar apenas Vault
docker-compose up -d vault

# Verificar se está saudável
docker ps | grep vault
# Esperado: delta-vault ... Up ... (healthy)

# Aguardar saúde (pode levar 10-15 segundos)
Start-Sleep -Seconds 15
```

**Se aparecer "healthy" → sucesso!** ✅

---

## 🎯 **PASSO 2: Inicializar Vault com Secrets (2 minutos)**

Execute o script PowerShell que criei:

```powershell
# Executar script de inicializacao
.\init-vault.ps1
```

**Esperado**: Você verá isto:

```
==================================================
  Inicializando HashiCorp Vault
==================================================

[1/5] Aguardando Vault estar pronto...
[OK] Vault respondendo

[2/5] Verificando autenticacao...
[OK] Token valido

[3/5] Adicionando secrets...
   [OK] postgres-password
   [OK] postgres-host
   [OK] postgres-port
   [OK] postgres-db
   [OK] postgres-user
   [OK] jwt-secret (aleatorio)

[4/5] Verificando secrets armazenados...
   [OK] Secrets acessiveis

[5/5] Exibindo informacoes de acesso...

Acesso ao Vault:
   URL:   http://localhost:8200
   Token: devtoken
   UI:    http://localhost:8200/ui

Secrets armazenados em:
   secret/data/delta/postgres-password
   secret/data/delta/postgres-host
   secret/data/delta/postgres-port
   secret/data/delta/postgres-db
   secret/data/delta/postgres-user
   secret/data/delta/jwt-secret

==================================================
  Vault inicializado com sucesso!
==================================================
```

---

## 🎯 **PASSO 3: Validar Vault Funcionando (2 minutos)**

```powershell
# 1. Testar health do Vault
curl http://localhost:8200/v1/sys/health
# Esperado: JSON com "sealed": false

# 2. Ler um secret (teste)
curl -H "X-Vault-Token: devtoken" `
  http://localhost:8200/v1/secret/data/delta/postgres-password | ConvertFrom-Json
# Esperado: Mostra a senha

# 3. Acessar UI (browser)
# http://localhost:8200/ui
# Token: devtoken
```

---

## 🎯 **PASSO 4: Preparar Backend para usar Vault (5 minutos)**

Vou criar o código que lê de Vault automaticamente. 

### **Para `postgres-server/server.js`:**

Adicionar no topo do arquivo (após `require('dotenv').config()`):

```javascript
// ====== VAULT INTEGRATION (fallback automatico) ======
const axios = require('axios');

const VAULT_ADDR = process.env.VAULT_ADDR || 'http://vault:8200';
const VAULT_TOKEN = process.env.VAULT_TOKEN || 'devtoken';

async function getVaultSecret(path) {
  try {
    const response = await axios.get(
      `${VAULT_ADDR}/v1/${path}`,
      {
        headers: { 'X-Vault-Token': VAULT_TOKEN },
        timeout: 3000,
      }
    );
    return response.data.data.data.value;
  } catch (error) {
    console.warn(`[VAULT] Indisponivel (${path}), usando fallback .env`);
    return null;
  }
}

// Carregar secrets na inicializacao
let dbPassword = process.env.PASSWORD;
let dbHost = process.env.HOST;
let dbPort = process.env.PORT;
let dbUser = process.env.DB_USER;
let dbName = process.env.DB;

async function initializeVault() {
  console.log('[VAULT] Tentando conectar...');
  
  const vaultPassword = await getVaultSecret('secret/data/delta/postgres-password');
  const vaultHost = await getVaultSecret('secret/data/delta/postgres-host');
  const vaultPort = await getVaultSecret('secret/data/delta/postgres-port');
  const vaultUser = await getVaultSecret('secret/data/delta/postgres-user');
  const vaultDb = await getVaultSecret('secret/data/delta/postgres-db');
  
  if (vaultPassword) {
    dbPassword = vaultPassword;
    console.log('[VAULT] Senha carregada do Vault');
  }
  if (vaultHost) {
    dbHost = vaultHost;
    console.log('[VAULT] Host carregado do Vault');
  }
  if (vaultPort) {
    dbPort = vaultPort;
    console.log('[VAULT] Port carregado do Vault');
  }
  if (vaultUser) {
    dbUser = vaultUser;
    console.log('[VAULT] User carregado do Vault');
  }
  if (vaultDb) {
    dbName = vaultDb;
    console.log('[VAULT] Database carregado do Vault');
  }
  
  // Se nenhum secret foi carregado, usa .env
  if (!vaultPassword && !vaultHost && !vaultPort && !vaultUser && !vaultDb) {
    console.warn('[VAULT] Todos indisponíveis, usando .env completamente');
  }
}

// ====== FIM VAULT INTEGRATION ======
```

Depois, na funcao que conecta ao banco (geralmente antes do `app.listen()`):

```javascript
// Chamar vault antes de conectar
initializeVault().then(() => {
  // Aqui jah temos os valores (de Vault ou .env)
  
  const config = {
    host: dbHost,
    port: dbPort,
    database: dbName,
    user: dbUser,
    password: dbPassword,
    ssl: false
  };

  console.log(`[DB] Conectando em ${config.host}:${config.port}/${config.database}`);
  
  // ... resto do codigo usa 'config' ...
  
  app.listen(port, () => {
    console.log(`Servidor PostgreSQL rodando em porta ${port}`);
  });
});
```

---

## 🔄 **TESTE: Validar Tudo Funcionando (3 minutos)**

```powershell
# 1. Parar e reiniciar backends
docker-compose down backend-postgres
docker-compose up -d backend-postgres

# 2. Aguardar inicializacao
Start-Sleep -Seconds 5

# 3. Verificar logs
docker logs delta-postgres-server | tail -20
# Procure por:
# [VAULT] Senha carregada do Vault
# [DB] Conectando em ...
# Servidor PostgreSQL rodando

# 4. Testar se backend responde
curl http://localhost:3002/health
# Esperado: JSON com status "healthy"

# 5. Testar se consegue acessar dados
curl http://localhost:3002/api/test
# Esperado: "Conexao PostgreSQL bem-sucedida!"
```

---

## ✅ **CHECKLIST: Fase 1 Completa**

- [ ] `docker-compose up -d vault` → container rodando
- [ ] `.\init-vault.ps1` → secrets adicionados
- [ ] `curl http://localhost:8200/v1/sys/health` → 200 OK
- [ ] Backend logs mostram `[VAULT] Senha carregada`
- [ ] `curl http://localhost:3002/health` → 200 OK
- [ ] Backend consegue conectar ao banco

Se tudo está checkado ✅ → **Fase 1 COMPLETA!**

---

## 🎁 **Bônus: Acessar Vault UI**

Abra no browser:
```
http://localhost:8200/ui
```

Faça login:
- **Token**: `devtoken`

Você verá:
- Secrets armazenados em `secret/data/delta/`
- Histórico de acessos
- Opção de rotacionar tokens

---

## 🔙 **Se precisar REVERTER (rollback)**

```powershell
# 1. Parar Vault
docker-compose down vault

# 2. Remover volume de dados
docker volume rm delta-navigator_vault_data

# 3. Restaurar docker-compose original
Copy-Item docker-compose.yml.backup docker-compose.yml

# 4. Reiniciar tudo
docker-compose up -d

# Voltou ao estado anterior!
```

---

## ⏭️ **Próxima Fase**

Assim que Fase 1 estiver 100% ok:

→ **Fase 2: Criptografia de Dados (CPF, CNPJ, Banco)**

---
