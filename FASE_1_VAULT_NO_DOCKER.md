# 🔐 FASE 1: Integrar Vault no Docker (SEM QUEBRAR NADA)

**Tempo**: 1-2 horas  
**Risco**: ⚠️ BAIXO (Vault roda em container isolado, fallback automático)  
**Status**: 🟡 Pronto para começar

---

## 📋 **ESTRATÉGIA SEGURA**

```
┌─────────────────────────────────────────────┐
│ ANTES (atual)                               │
├─────────────────────────────────────────────┤
│ backend-sql  → .env (hardcoded)            │
│ backend-postgres → .env (hardcoded)        │
│ backend-extrato → .env (hardcoded)         │
│ backend-contratos → .env (hardcoded)       │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ DEPOIS (incremental)                        │
├─────────────────────────────────────────────┤
│ ┌─────────────────┐                        │
│ │ Vault (novo)    │ ← container isolado    │
│ └────────┬────────┘                        │
│          │                                  │
│ ┌────────▼──────────────────────────────┐ │
│ │ backend-sql                            │ │
│ │  ├─ Tenta: Vault                       │ │
│ │  └─ Fallback: .env (seguro!)          │ │
│ └────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────┐ │
│ │ backend-postgres (mesmo padrão)        │ │
│ └────────────────────────────────────────┘ │
│ ... outros backends (não mudam)           │
└─────────────────────────────────────────────┘
```

**Vantagens**:
✅ Se Vault falhar → usa .env (não quebra)  
✅ Sem alterar containers existentes  
✅ Pode reverter em 5 minutos  
✅ Testa primeiro em dev, depois prod  

---

## 🚀 **PASSO 1: Adicionar Vault ao docker-compose.yml**

Abrir: `docker-compose.yml`

Procurar pela linha `networks:` no final e adicionar o serviço Vault **ANTES** dela:

```yaml
# Adicionar isto DEPOIS do serviço "backend-contratos" e ANTES de "networks:"

  vault:
    image: vault:1.15.0
    container_name: delta-vault
    ports:
      - "8200:8200"
    environment:
      - VAULT_DEV_ROOT_TOKEN_ID=devtoken
      - VAULT_DEV_LISTEN_ADDRESS=0.0.0.0:8200
      - VAULT_LOG_LEVEL=info
    cap_add:
      - IPC_LOCK
    volumes:
      - vault_data:/vault/data
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:8200/v1/sys/health"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - delta-network
    restart: unless-stopped
    labels:
      - "app=delta-navigator"
      - "component=vault"
```

Depois, ao **final do docker-compose.yml**, adicionar o volume para Vault:

```yaml
volumes:
  vault_data:
    driver: local
  # ... outros volumes já existentes ...
```

**Verificação**: `docker-compose config | grep -A 20 "vault:"`

---

## 🚀 **PASSO 2: Criar função para ler Vault (fallback seguro)**

Criar arquivo: `server/lib/secrets.ts` (ou `.js` se preferir)

```typescript
// server/lib/secrets.ts

import axios from 'axios';

const VAULT_ADDR = process.env.VAULT_ADDR || 'http://vault:8200';
const VAULT_TOKEN = process.env.VAULT_TOKEN || 'devtoken';

/**
 * Interface para secrets estruturados
 */
interface SecretValue {
  value: string;
}

/**
 * Busca secret do Vault com fallback para .env
 * @param path Caminho no Vault (ex: 'secret/delta/db-password')
 * @param envKey Variável de ambiente fallback (ex: 'POSTGRES_PASSWORD')
 * @returns Valor do secret
 */
export async function getSecret(
  path: string,
  envKey?: string
): Promise<string> {
  // 1️⃣ Tenta Vault primeiro
  try {
    const response = await axios.get(
      `${VAULT_ADDR}/v1/${path}`,
      {
        headers: { 'X-Vault-Token': VAULT_TOKEN },
        timeout: 3000, // 3 segundos max
      }
    );

    const value = response.data?.data?.data?.value;
    if (value) {
      console.log(`✅ Secret carregado do Vault: ${path}`);
      return value;
    }
  } catch (vaultError) {
    console.warn(`⚠️  Vault indisponível (${path}), usando fallback .env`);
  }

  // 2️⃣ Fallback para .env
  if (envKey && process.env[envKey]) {
    console.log(`✅ Secret carregado do .env: ${envKey}`);
    return process.env[envKey]!;
  }

  // 3️⃣ Erro se nenhuma fonte disponível
  throw new Error(
    `Secret não encontrado: ${path} (fallback: ${envKey || 'nenhum'})`
  );
}

/**
 * Versão síncrona para inicialização
 * (carrega secrets uma vez na startup)
 */
export async function loadSecrets() {
  const secrets = {
    dbPassword: await getSecret(
      'secret/data/delta/postgres-password',
      'POSTGRES_PASSWORD'
    ),
    dbHost: await getSecret(
      'secret/data/delta/postgres-host',
      'POSTGRES_HOST'
    ),
    dbPort: await getSecret(
      'secret/data/delta/postgres-port',
      'POSTGRES_PORT'
    ),
    dbName: await getSecret(
      'secret/data/delta/postgres-db',
      'POSTGRES_DATABASE'
    ),
    dbUser: await getSecret(
      'secret/data/delta/postgres-user',
      'POSTGRES_USER'
    ),
    sqlserverPassword: await getSecret(
      'secret/data/delta/sqlserver-password',
      'SQLSERVER_PASSWORD'
    ),
    jwtSecret: await getSecret(
      'secret/data/delta/jwt-secret',
      'JWT_SECRET'
    ),
  };

  console.log('🔑 Secrets carregados com sucesso!');
  return secrets;
}

export type AppSecrets = Awaited<ReturnType<typeof loadSecrets>>;
```

**Usar assim** no seu `server.js` ou `postgres-server/server.js`:

```javascript
// No topo do arquivo:
import { loadSecrets } from './lib/secrets.js';

// Na inicialização:
async function startServer() {
  try {
    // Carregar secrets (ou usar .env como fallback)
    const secrets = await loadSecrets();

    // Usar secrets normalmente
    const pool = new Pool({
      host: secrets.dbHost,
      port: parseInt(secrets.dbPort),
      database: secrets.dbName,
      user: secrets.dbUser,
      password: secrets.dbPassword,
    });

    // Resto do código...
  } catch (error) {
    console.error('Erro ao carregar secrets:', error);
    process.exit(1);
  }
}

startServer();
```

---

## 🚀 **PASSO 3: Testar Vault em DEV (sem quebrar nada)**

```bash
# 1. Ir pro diretório do projeto
cd C:\Users\alexsandro.costa\Delta-Navigator

# 2. Iniciar containers (Vault incluído)
docker-compose up -d

# 3. Verificar se Vault está rodando
docker ps | grep vault
# Deve mostrar: delta-vault

# 4. Verificar health de Vault
curl http://localhost:8200/v1/sys/health
# Esperado: HTTP 200 com JSON

# 5. Acessar UI Vault (opcional)
# Browser: http://localhost:8200/ui
# Token: devtoken

# 6. Adicionar secrets ao Vault (via CLI)
docker exec delta-vault vault login devtoken

docker exec delta-vault vault kv put secret/delta/postgres-password \
  value="SuaSenhaPostgres123!@"

docker exec delta-vault vault kv put secret/delta/postgres-host \
  value="postgres"

docker exec delta-vault vault kv put secret/delta/postgres-db \
  value="delta_navigator"

# 7. Verificar se foi armazenado
docker exec delta-vault vault kv get secret/delta/postgres-password
# Esperado: mostra o value

# 8. Testar se backend consegue conectar
curl http://localhost:3001/health
curl http://localhost:3002/health

# Se ambos retornam 200 OK → ✅ sucesso!
```

---

## 🚀 **PASSO 4: Implementar no Backend (mínimas mudanças)**

Editar: `server/server.js` ou `postgres-server/server.js`

Apenas adicionar isto no topo:

```javascript
// Adicionar NO TOPO do arquivo server.js

// Suporte a Vault (com fallback .env)
let dbPassword = process.env.POSTGRES_PASSWORD;

// Se Vault estiver disponível, tentar usar
if (process.env.VAULT_ADDR) {
  const axios = require('axios');
  const vaultAddr = process.env.VAULT_ADDR || 'http://vault:8200';
  const vaultToken = process.env.VAULT_TOKEN || 'devtoken';

  axios
    .get(`${vaultAddr}/v1/secret/data/delta/postgres-password`, {
      headers: { 'X-Vault-Token': vaultToken },
      timeout: 3000,
    })
    .then((response) => {
      dbPassword = response.data.data.data.value;
      console.log('✅ Senha carregada do Vault');
    })
    .catch(() => {
      console.warn('⚠️  Vault indisponível, usando .env');
      // Mantém o valor de .env
    });
}

// Resto do código usa dbPassword normalmente...
const pool = new sql.ConnectionPool({
  server: process.env.SQLSERVER_HOST || 'localhost',
  authentication: {
    type: 'default',
    options: {
      userName: process.env.SQLSERVER_USER,
      password: dbPassword, // ← agora vem de Vault ou .env
    },
  },
  // ... resto das configs
});
```

---

## 🚀 **PASSO 5: Testar tudo (seguro)**

```bash
# 1. Parar tudo
docker-compose down

# 2. Reiniciar com Vault
docker-compose up -d

# 3. Esperar Vault estar pronto
echo "Aguardando Vault..."
sleep 5

# 4. Popular Vault com secrets
docker exec delta-vault vault kv put secret/delta/postgres-password value="YourPassword123"

# 5. Testar backends
curl http://localhost:3001/health
curl http://localhost:3002/health

# 6. Verificar logs
docker logs delta-backend-sql | tail -20
docker logs delta-backend-postgres | tail -20

# Procura por:
# ✅ "✅ Senha carregada do Vault" → Vault funcionando
# ✅ "⚠️  Vault indisponível, usando .env" → Fallback funcionando
# ❌ Erros de conexão = problema
```

---

## ⚠️ **ROLLBACK (se quebrar)**

```bash
# Reverter em 5 minutos:

# 1. Parar containers
docker-compose down

# 2. Editar docker-compose.yml
#    → Remover seção "vault:"
#    → Remover "vault_data:" dos volumes

# 3. Editar server/server.js
#    → Remover código de Vault (apenas 10 linhas)

# 4. Reiniciar
docker-compose up -d

# Voltou ao estado anterior (apenas usando .env)
```

---

## 📊 **CHECKLIST: FASE 1 COMPLETA**

- [ ] Vault adicionado ao `docker-compose.yml`
- [ ] Arquivo `server/lib/secrets.ts` criado
- [ ] Modificado `server/server.js` (ou `postgres-server/server.js`)
- [ ] `docker-compose up -d` rodando sem erros
- [ ] Vault container saudável: `docker ps | grep vault`
- [ ] Secrets adicionados ao Vault: `vault kv get secret/delta/postgres-password`
- [ ] Backend conecta ao Vault: `curl http://localhost:3001/health`
- [ ] Logs mostram "✅ Senha carregada do Vault"
- [ ] Fallback funciona (testa pausando Vault)

---

## 🎯 **PRÓXIMO PASSO**

Assim que confirmar que Fase 1 está rodando perfeitamente:

1. **Fase 2**: Criptografia de dados (CPF, CNPJ, banco)
2. **Fase 3**: Audit logs automáticos (triggers SQL)
3. **Fase 4**: CORS restritivo + rate limiting
4. **Fase 5**: Testes (npm audit, OWASP ZAP)

---

## 💡 **DÚVIDAS FREQUENTES**

**P: E se Vault cair, o backend quebra?**  
R: Não! Fallback automático para .env. Mas loga um aviso.

**P: Preciso mexer em todos os backends?**  
R: Não. Faça um por vez. Comece com `postgres-server/server.js`.

**P: Posso usar Vault em produção assim?**  
R: Não! Em produção:
- [ ] Usar token Vault real (não 'devtoken')
- [ ] Ativar TLS no Vault
- [ ] Usar unseal automático com KMS
- [ ] Backup regular de dados

**P: Como populo Vault automaticamente?**  
R: Crie script `init-vault.sh` no docker-compose (veremos depois).

---
