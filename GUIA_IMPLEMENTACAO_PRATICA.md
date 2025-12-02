# 🔧 GUIA PRÁTICO DE IMPLEMENTAÇÃO - Conformidade BACEN

## Passo a Passo: O que Fazer Agora

---

## ⏰ **SEMANA 1-2: Credenciais e HTTPS**

### **PASSO 1: Auditoria de Credenciais Expostas**

```bash
# 1. Procurar credenciais em código
grep -r "password\|secret\|token\|api_key" --include="*.js" --include="*.ts" \
  --include="*.json" --include=".env*" --exclude-dir=node_modules .

# 2. Verificar histórico Git
git log --all --source --full-history -S "password\|secret" -- "*.js" "*.ts"

# 3. Resultado esperado:
# ❌ server/server.js:25 password: 'MinhaSenh@123'
# ❌ postgres-server/server.js:18 password: env || 'default'
# ❌ .env files diversos
```

### **PASSO 2: Implementar AWS Secrets Manager**

```bash
# 1. Instalar AWS CLI e SDK
npm install @aws-sdk/client-secrets-manager dotenv

# 2. Criar arquivo: server/secrets.js
```

```javascript
// server/secrets.js
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const dotenv = require('dotenv');

// Em desenvolvimento, usar .env
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

class SecretsManager {
  constructor() {
    this.client = new SecretsManagerClient({ region: process.env.AWS_REGION });
    this.cache = {};
  }

  async getSecret(secretName) {
    // Cache por 1 hora
    if (this.cache[secretName] && Date.now() - this.cache[secretName].time < 3600000) {
      return this.cache[secretName].value;
    }

    try {
      const command = new GetSecretValueCommand({ SecretId: secretName });
      const data = await this.client.send(command);
      const secretString = data.SecretString || data.SecretBinary;
      
      this.cache[secretName] = {
        value: secretString,
        time: Date.now()
      };

      return secretString;
    } catch (error) {
      console.error(`Erro ao buscar secret ${secretName}:`, error);
      
      // Fallback para .env em desenvolvimento
      if (process.env.NODE_ENV !== 'production') {
        return process.env[secretName];
      }
      throw error;
    }
  }
}

module.exports = new SecretsManager();
```

```bash
# 3. Criar secrets no AWS
aws secretsmanager create-secret \
  --name delta-navigator/db-password \
  --secret-string "YourRealPassword123"

aws secretsmanager create-secret \
  --name delta-navigator/jwt-secret \
  --secret-string "YourJWTSecretKey"

# 4. Atualizar server.js
```

```javascript
// server/server.js
const secrets = require('./secrets');

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  database: process.env.POSTGRES_DATABASE,
  user: process.env.POSTGRES_USER,
  password: await secrets.getSecret('delta-navigator/db-password'),
  // ❌ NÃO MAIS: password: process.env.POSTGRES_PASSWORD || 'MinhaSenh@123'
});
```

```bash
# 5. Atualizar docker-compose-simple.yml
```

```yaml
# docker-compose-simple.yml
backend-server:
  environment:
    - NODE_ENV=production
    - AWS_REGION=us-east-1
    - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
    - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
  # ❌ NÃO MAIS: - POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-MinhaSenh@123}
```

```bash
# 6. Deletar .env com credenciais
rm .env
rm server/.env
rm postgres-server/.env

# 7. Adicionar ao .gitignore
echo ".env*" >> .gitignore
echo "!.env.example" >> .gitignore

# 8. Fazer commit
git add .
git commit -m "feat: remover credenciais do código, usar AWS Secrets Manager"
git push
```

**Verificação**:
```bash
# Confirmar que não há mais credenciais
git log --all -p -S "MinhaSenh@123" -- "*.js"
# Resultado esperado: (empty - nada encontrado)
```

---

### **PASSO 3: Ativar HTTPS/TLS**

```bash
# 1. Instalar certificado com Let's Encrypt
npm install certbot

# Em servidor Linux:
sudo apt-get install certbot python3-certbot-nginx

# Solicitar certificado
sudo certbot certonly --standalone \
  -d delta-navigator.com \
  -d app.delta-navigator.com \
  -d staging.delta-navigator.com
```

```javascript
// server/server.js - Adicionar HTTPS
const https = require('https');
const fs = require('fs');

// Carregar certificados
const sslOptions = {
  key: fs.readFileSync(process.env.TLS_KEY_PATH || './certs/key.pem'),
  cert: fs.readFileSync(process.env.TLS_CERT_PATH || './certs/cert.pem'),
};

// Criar servidor HTTPS
const httpsServer = https.createServer(sslOptions, app);
const HTTP_PORT = process.env.HTTP_PORT || 3000;
const HTTPS_PORT = process.env.HTTPS_PORT || 3001;

// Redirecionar HTTP → HTTPS
const httpApp = require('express')();
httpApp.use((req, res) => {
  res.redirect(301, `https://${req.headers.host}${req.url}`);
});
require('http').createServer(httpApp).listen(HTTP_PORT);

// Escutar HTTPS
httpsServer.listen(HTTPS_PORT, () => {
  console.log(`✅ HTTPS server escutando em porta ${HTTPS_PORT}`);
});
```

```javascript
// Middleware HSTS (HTTP Strict Transport Security)
app.use((req, res, next) => {
  res.setHeader(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );
  next();
});
```

```yaml
# docker-compose-simple.yml
backend-server:
  volumes:
    - ./certs:/app/certs:ro
  ports:
    - "3000:3000"   # HTTP (redireciona para HTTPS)
    - "3001:3001"   # HTTPS
  environment:
    - TLS_KEY_PATH=/app/certs/key.pem
    - TLS_CERT_PATH=/app/certs/cert.pem
```

**Verificação**:
```bash
# Testar HTTPS
curl -I https://localhost:3001
# Resposta esperada: HTTP/2 200

# Testar redirecionamento HTTP → HTTPS
curl -I http://localhost:3000/health
# Resposta esperada: 301 (redirecionado)

# Verificar certificado
openssl s_client -connect localhost:3001
# Verificar validade e CN (Common Name)
```

---

## ⏰ **SEMANA 3-4: CORS e RBAC**

### **PASSO 4: Fechar CORS**

```typescript
// src/middleware/cors-config.ts
import cors from 'cors';

const allowedOrigins = [
  'https://delta-navigator.com',
  'https://app.delta-navigator.com',
  'https://staging.delta-navigator.com',
];

// Em desenvolvimento
if (process.env.NODE_ENV === 'development') {
  allowedOrigins.push('http://localhost:3000');
  allowedOrigins.push('http://localhost:5173');
}

export const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS não permitido para: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Number'],
  maxAge: 3600,
  optionsSuccessStatus: 200,
};

export default cors(corsOptions);
```

```javascript
// server/server.js
const corsMiddleware = require('../src/middleware/cors-config');

app.use(corsMiddleware);
app.options('*', corsMiddleware); // Enable pre-flight
```

**Teste**:
```bash
# Origem permitida
curl -H "Origin: https://delta-navigator.com" \
  -H "Access-Control-Request-Method: POST" \
  https://api.delta-navigator.com/health
# Resposta: ✅ ACEITO

# Origem não permitida
curl -H "Origin: https://hacker.com" \
  https://api.delta-navigator.com/health
# Resposta: 🚫 CORS error
```

---

### **PASSO 5: Implementar RBAC Básico**

```sql
-- supabase/migrations/20251125_rbac.sql

-- 1. Criar enum de roles
CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'editor', 'viewer');

-- 2. Tabela de roles
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name user_role NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de permissões
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  resource VARCHAR(50), -- 'users', 'contracts', 'financial', 'logs'
  action VARCHAR(20),   -- 'read', 'write', 'delete', 'admin'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabela de role-permissions (many-to-many)
CREATE TABLE role_permissions (
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- 5. Adicionar coluna role à tabela de usuários
ALTER TABLE auth.users ADD COLUMN role user_role DEFAULT 'viewer';

-- 6. Inserir roles
INSERT INTO roles (name, description) VALUES
  ('super_admin', 'Acesso total ao sistema'),
  ('admin', 'Administrador de dados'),
  ('editor', 'Pode editar dados'),
  ('viewer', 'Apenas leitura');

-- 7. Inserir permissões
INSERT INTO permissions (name, description, resource, action) VALUES
  ('read:users', 'Ver usuários', 'users', 'read'),
  ('write:users', 'Editar usuários', 'users', 'write'),
  ('admin:users', 'Gerenciar usuários', 'users', 'admin'),
  ('read:contracts', 'Ver contratos', 'contracts', 'read'),
  ('write:contracts', 'Editar contratos', 'contracts', 'write'),
  ('read:financial', 'Ver dados financeiros', 'financial', 'read'),
  ('write:financial', 'Editar financeiro', 'financial', 'write'),
  ('read:logs', 'Ver audit logs', 'logs', 'read');

-- 8. Vincular permissões aos roles
-- Super Admin: Tudo
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'super_admin';

-- Admin: Tudo exceto gerenciar usuários super_admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'admin' AND p.name != 'admin:users';

-- Editor: Ler e escrever dados
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'editor' AND p.action IN ('read', 'write');

-- Viewer: Apenas leitura
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'viewer' AND p.action = 'read';

-- 9. RLS: Usuários só podem ver seus próprios dados
CREATE POLICY "Usuários podem ver apenas seus dados"
ON users FOR SELECT
USING (auth.uid() = id);

-- 10. RLS: Admin pode ver tudo
CREATE POLICY "Admin pode ver tudo"
ON users FOR SELECT
USING (
  auth.jwt() ->> 'role' = 'admin' OR 
  auth.jwt() ->> 'role' = 'super_admin'
);
```

```typescript
// src/hooks/usePermissions.ts
import { useAuth } from './useAuth';
import { supabase } from '@/data/supabase';
import { useQuery } from '@tanstack/react-query';

export function usePermissions() {
  const { user } = useAuth();

  const { data: userPermissions } = useQuery({
    queryKey: ['permissions', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data } = await supabase
        .from('role_permissions')
        .select('permissions(name)')
        .eq('roles.name', user.role);

      return data?.map((rp: any) => rp.permissions.name) || [];
    },
    enabled: !!user,
  });

  const hasPermission = (permission: string): boolean => {
    return userPermissions?.includes(permission) || false;
  };

  return { userPermissions, hasPermission };
}
```

```typescript
// src/components/PermissionGate.tsx
import { usePermissions } from '@/hooks/usePermissions';

export function PermissionGate({
  permission,
  children,
  fallback = null,
}: {
  permission: string | string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { hasPermission } = usePermissions();

  const permissions = Array.isArray(permission) ? permission : [permission];
  const hasAccess = permissions.some(p => hasPermission(p));

  if (!hasAccess) return fallback;
  return <>{children}</>;
}
```

**Uso em Componentes**:
```tsx
// src/pages/ContratosPage.tsx
<PermissionGate permission="write:contracts">
  <Button onClick={handleCreate}>Criar Contrato</Button>
</PermissionGate>

<PermissionGate permission="admin:users" fallback={<p>Sem acesso</p>}>
  <UsersManager />
</PermissionGate>
```

---

### **PASSO 6: Rate Limiting**

```bash
npm install express-rate-limit
```

```typescript
// src/middleware/rate-limit.ts
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redis from 'redis';

// Usar Redis para rate limiting distribuído
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
});

export const apiLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:api:',
  }),
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requisições por janela
  message: 'Muitas requisições, tente novamente em 15 minutos',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health',
});

export const authLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:auth:',
  }),
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 tentativas de login
  skipSuccessfulRequests: true,
  message: 'Muitas tentativas de login, tente novamente em 15 minutos',
});

export const createLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:create:',
  }),
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 50, // 50 registros por hora
  message: 'Limite de criação excedido',
});
```

```javascript
// server/server.js
const { apiLimiter, authLimiter, createLimiter } = require('../src/middleware/rate-limit');

// Aplicar globalmente
app.use('/api/', apiLimiter);

// Específico para login
app.post('/auth/login', authLimiter, loginHandler);

// Específico para criar
app.post('/api/contracts', createLimiter, createContractHandler);
```

---

## ⏰ **SEMANA 5-8: Criptografia**

### **PASSO 7: Encriptação em Repouso (At-Rest)**

```typescript
// src/services/encryption.ts
import crypto from 'crypto';

export class EncryptionService {
  private algorithm = 'aes-256-gcm';
  private masterKey: Buffer;

  constructor(masterKeyHex: string) {
    this.masterKey = Buffer.from(masterKeyHex, 'hex');
    if (this.masterKey.length !== 32) {
      throw new Error('Master key deve ter exatamente 32 bytes');
    }
  }

  encrypt(plaintext: string): {
    ciphertext: string;
    iv: string;
    authTag: string;
  } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.masterKey, iv);

    let ciphertext = cipher.update(plaintext, 'utf-8', 'hex');
    ciphertext += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return {
      ciphertext,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
    };
  }

  decrypt(encrypted: {
    ciphertext: string;
    iv: string;
    authTag: string;
  }): string {
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.masterKey,
      Buffer.from(encrypted.iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(encrypted.authTag, 'hex'));

    let plaintext = decipher.update(encrypted.ciphertext, 'hex', 'utf-8');
    plaintext += decipher.final('utf-8');

    return plaintext;
  }
}

// Singleton
import secrets from './secrets';

export async function getEncryptionService(): Promise<EncryptionService> {
  const masterKey = await secrets.getSecret('delta-navigator/master-key');
  return new EncryptionService(masterKey);
}
```

```sql
-- supabase/migrations/20251125_encryption.sql

-- Adicionar colunas para dados encriptados
ALTER TABLE clients ADD COLUMN cpf_encrypted TEXT;
ALTER TABLE clients ADD COLUMN cpf_iv TEXT;
ALTER TABLE clients ADD COLUMN cpf_auth_tag TEXT;

ALTER TABLE clients ADD COLUMN cnpj_encrypted TEXT;
ALTER TABLE clients ADD COLUMN cnpj_iv TEXT;
ALTER TABLE clients ADD COLUMN cnpj_auth_tag TEXT;

-- Criar índices para busca em dados encriptados
-- (usar hash tokenizado para buscar sem descriptografar)
ALTER TABLE clients ADD COLUMN cpf_hash VARCHAR(64);
CREATE UNIQUE INDEX idx_clients_cpf_hash ON clients(cpf_hash);

-- Função para gerar hash tokenizado (busca segura)
CREATE OR REPLACE FUNCTION hash_token(plaintext TEXT)
RETURNS VARCHAR AS $$
SELECT encode(digest(plaintext, 'sha256'), 'hex');
$$ LANGUAGE SQL IMMUTABLE;

-- Índices nas colunas sensíveis
CREATE INDEX idx_clients_cpf_encrypted ON clients(cpf_encrypted);
CREATE INDEX idx_contracts_amount ON contracts(amount);
```

```typescript
// Ao inserir novo cliente
const enc = await getEncryptionService();

const cpfEncrypted = enc.encrypt(cpf);
const cnpjEncrypted = enc.encrypt(cnpj);

await db.clients.insert({
  nome,
  email,
  
  // CPF encriptado
  cpf_encrypted: cpfEncrypted.ciphertext,
  cpf_iv: cpfEncrypted.iv,
  cpf_auth_tag: cpfEncrypted.authTag,
  cpf_hash: hashToken(cpf), // Para busca
  
  // CNPJ encriptado
  cnpj_encrypted: cnpjEncrypted.ciphertext,
  cnpj_iv: cnpjEncrypted.iv,
  cnpj_auth_tag: cnpjEncrypted.authTag,
});

// Ao buscar cliente
const client = await db.clients.findOne({ cpf_hash: hashToken(searchCpf) });

// Descriptografar quando needed
const cpf = enc.decrypt({
  ciphertext: client.cpf_encrypted,
  iv: client.cpf_iv,
  authTag: client.cpf_auth_tag,
});
```

---

## 📋 **Checklist Pronto para Executar**

### Semana 1
- [ ] Executar auditoria de credenciais
- [ ] Criar AWS Secrets Manager account
- [ ] Criar secrets (DB password, JWT, etc)
- [ ] Implementar secrets.js
- [ ] Atualizar server.js em todos os servidores
- [ ] Testar em staging
- [ ] Deletar .env com credenciais
- [ ] Git push com "feat: remove credentials"

### Semana 2
- [ ] Gerar certificado SSL/TLS (Let's Encrypt)
- [ ] Ativar HTTPS em todos os servidores
- [ ] Configurar HSTS headers
- [ ] Testar com SSL Labs (grade A)
- [ ] Atualizar docker-compose

### Semana 3
- [ ] Implementar CORS restritivo
- [ ] Testar CORS em staging
- [ ] Listar todos os domínios permitidos
- [ ] Remover '*' de CORS

### Semana 4
- [ ] Criar tabelas RBAC (migrations)
- [ ] Inserir roles e permissions
- [ ] Implementar PermissionGate component
- [ ] Implementar RLS no Supabase
- [ ] Rate limiting com Redis
- [ ] Testar acesso não autorizado (deve falhar)

### Semana 5-8
- [ ] Implementar EncryptionService
- [ ] Criptografar campos sensíveis
- [ ] Migrations para dados existentes
- [ ] Testar encrypt/decrypt
- [ ] Documentar backup de master key

---

**Próximo passo**: Execute AGORA o PASSO 1 (Auditoria de credenciais)!
