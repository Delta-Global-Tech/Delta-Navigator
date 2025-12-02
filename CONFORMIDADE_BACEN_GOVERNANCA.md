# 🏦 Conformidade BACEN e Governança de Dados
## Delta Navigator - Plano de Adequação Regulatória

**Data**: 25 de Novembro de 2025  
**Versão**: 1.0  
**Status**: Proposta de Implementação

---

## 📋 **Índice**

1. [Resumo Executivo](#-resumo-executivo)
2. [Normas BACEN Aplicáveis](#-normas-bacen-aplicáveis)
3. [Diagnóstico Atual](#-diagnóstico-atual)
4. [Plano de Ação Detalhado](#-plano-de-ação-detalhado)
5. [Checklist de Conformidade](#-checklist-de-conformidade)
6. [Implementação Técnica](#-implementação-técnica)
7. [Timeline de Implementação](#-timeline-de-implementação)

---

## 📊 **Resumo Executivo**

Seu sistema **Delta Navigator** processa dados financeiros sensíveis e requer conformidade com:

- ✅ **Resolução BACEN 4.658/2018** - Infraestrutura de TI
- ✅ **Resolução BACEN 4.893/2021** - Segurança da Informação
- ✅ **Instrução Normativa BACEN 162/2021** - Controles Internos
- ✅ **Lei Geral de Proteção de Dados (LGPD)** - Privacidade
- ✅ **Resolução BACEN 4.860/2020** - Open Banking
- ✅ **Circular BACEN 4.068/2021** - Governança de Dados

---

## 🏛️ **Normas BACEN Aplicáveis**

### **1. Resolução BACEN 4.658/2018 - Infraestrutura de TI**

| Requisito | Status | Ação |
|-----------|--------|------|
| **Disponibilidade** (99,99%) | 🟡 Parcial | Implementar health checks e auto-healing |
| **Backup e Recuperação** | 🔴 Ausente | Planejar backup automático geograficamente distribuído |
| **Disaster Recovery** | 🔴 Ausente | Implementar RTO/RPO adequado |
| **Segregação de Ambientes** | 🟡 Parcial | Separar dev/staging/prod com políticas distintas |
| **Monitoramento 24/7** | 🟡 Parcial | Implementar alertas em tempo real |
| **Controle de Mudanças** | 🟡 Parcial | Implementar change management formal |

---

### **2. Resolução BACEN 4.893/2021 - Segurança da Informação**

| Requisito | Status | Ação |
|-----------|--------|------|
| **Criptografia (em trânsito)** | 🟡 Parcial | Forçar TLS 1.2+ em toda comunicação |
| **Criptografia (em repouso)** | 🔴 Ausente | Criptografar dados sensíveis no BD |
| **Controle de Acesso** | 🟡 Parcial | Implementar RBAC (Role-Based Access Control) |
| **Autenticação Multifator** | 🟡 Parcial | Adicionar MFA obrigatória para admin |
| **Gestão de Chaves** | 🔴 Ausente | Implementar HSM ou Key Management Service |
| **Proteção de Senhas** | 🟡 Parcial | Usar bcrypt/argon2 (verificar implementação) |
| **Logs de Segurança** | 🟡 Parcial | Centralizar logs em sistema imutável |
| **Penetration Testing** | 🔴 Ausente | Realizar testes de penetração anualmente |

---

### **3. Instrução Normativa BACEN 162/2021 - Controles Internos**

| Requisito | Status | Ação |
|-----------|--------|------|
| **Segregação de Funções** | 🟡 Parcial | Evitar mesmo usuário dev=deploy=audit |
| **Autorização e Aprovação** | 🟡 Parcial | Implementar workflow com aprovação de mudanças |
| **Validação de Entrada** | 🟡 Parcial | Validar todos os inputs com schemas (Zod) |
| **Trilha de Auditoria Completa** | 🟡 Parcial | Expandir audit log para TODAS as operações |
| **Segregação de Rede** | 🟡 Parcial | Firewall entre componentes críticos |
| **Teste de Segurança Regular** | 🔴 Ausente | SAST, DAST, SCA automático no CI/CD |

---

### **4. Lei Geral de Proteção de Dados (LGPD)**

| Requisito | Status | Ação |
|-----------|--------|------|
| **Consentimento Explícito** | 🟡 Parcial | Registrar consentimento de uso de dados |
| **Direito ao Esquecimento** | 🔴 Ausente | Implementar exclusão de dados pessoais |
| **Portabilidade de Dados** | 🔴 Ausente | Permitir exportação em formato aberto |
| **Data Breach Notification** | 🟡 Parcial | Notificar em 72h (verificar implementação) |
| **Registro de Processamento** | 🟡 Parcial | Documentar processamentos (DPIA) |
| **Privacidade por Design** | 🟡 Parcial | Minimizar coleta de dados |

---

### **5. Resolução BACEN 4.860/2020 - Open Banking**

| Requisito | Status | Ação |
|-----------|--------|------|
| **API Padronizada** | 🟡 Parcial | Implementar segundo especificação Open Banking Brasil |
| **Segurança de API** | 🟡 Parcial | OAuth 2.0 + Mutual TLS |
| **Rate Limiting** | 🟡 Parcial | Proteger contra abuso |
| **Versionamento de API** | 🟡 Parcial | Suportar múltiplas versões |

---

### **6. Circular BACEN 4.068/2021 - Governança de Dados**

| Requisito | Status | Ação |
|-----------|--------|------|
| **Qualidade de Dados** | 🔴 Ausente | Implementar data quality checks |
| **Metadados Documentados** | 🔴 Ausente | Data dictionary e lineage |
| **Retenção de Dados** | 🔴 Ausente | Política de retenção explícita |
| **Classificação de Dados** | 🟡 Parcial | Classificar por sensibilidade |
| **DPO (Data Protection Officer)** | 🔴 Ausente | Designar responsável LGPD |

---

## 🔍 **Diagnóstico Atual**

### **Pontos Fortes ✅**

```
✅ Autenticação com Supabase (OAuth2)
✅ Audit log implementado
✅ Row Level Security (RLS) no Supabase
✅ CORS configurado
✅ Pool de conexões no PostgreSQL
✅ Validação básica com Zod
✅ Health checks nos serviços
✅ Gamification com rastreamento de usuário
```

### **Gaps de Segurança 🔴**

```
🔴 CRÍTICO: Senha hardcoded em arquivos de configuração
🔴 CRÍTICO: CORS permite '*' (qualquer origem)
🔴 CRÍTICO: Sem validação de entrada completa
🔴 CRÍTICO: Sem encriptação de dados sensíveis no BD
🔴 CRÍTICO: Sem controle granular de permissões (RBAC)
🔴 CRÍTICO: Sem rate limiting nas APIs
🔴 CRÍTICO: Logs sem proteção contra modificação
🔴 CRÍTICO: Sem teste de segurança automatizado
```

### **Gaps de Governança 🔴**

```
🔴 CRÍTICO: Sem documentação de origem de dados (data lineage)
🔴 CRÍTICO: Sem política de retenção de dados
🔴 CRÍTICO: Sem data quality framework
🔴 CRÍTICO: Sem metadados centralizados
🔴 CRÍTICO: Sem classificação de dados (sensível/público)
🔴 CRÍTICO: Sem DPO designado formalmente
🔴 CRÍTICO: Sem DPIA (Data Protection Impact Assessment)
```

---

## 🎯 **Plano de Ação Detalhado**

### **FASE 1: SEGURANÇA CRÍTICA (Semanas 1-4)**

#### **1.1 - Remover Credenciais Hardcoded**

**Problema**:
```javascript
// ❌ CRÍTICO: Senha no código
const pool = new Pool({
  password: process.env.POSTGRES_PASSWORD || 'MinhaSenh@123'
});
```

**Solução**:
```bash
# 1. Usar gerenciador de secrets
npm install dotenv-vault aws-secretsmanager-client

# 2. Arquivo: server/secrets-manager.js
const secretsManager = require('./secrets-manager');

const password = await secretsManager.getSecret('DB_PASSWORD');
const pool = new Pool({
  password: password,
  // Usar variáveis sem valores padrão
});

# 3. CI/CD deve injetar secrets em tempo de deployment
```

**Checklist**:
- [ ] Revisar todos arquivos .env e server.js
- [ ] Mover secrets para gerenciador (AWS Secrets Manager / Vault)
- [ ] Remover valores padrão de credenciais
- [ ] Auditar commits históricos para secrets expostos

---

#### **1.2 - Implementar CORS Adequado**

**Problema**:
```javascript
// ❌ CRÍTICO: Permite qualquer origem
res.header('Access-Control-Allow-Origin', '*');
```

**Solução**:
```typescript
// src/middleware/cors-config.ts
export const corsConfig = {
  origin: [
    'https://delta-navigator.com',
    'https://app.delta-navigator.com',
    // staging
    'https://staging.delta-navigator.com',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 3600,
};

// server.js
import cors from 'cors';
app.use(cors(corsConfig));
```

**Checklist**:
- [ ] Listar todos os domínios permitidos
- [ ] Remover '*' de todas as APIs
- [ ] Testar CORS em staging/prod
- [ ] Configurar subdomain adequadamente

---

#### **1.3 - Implementar RBAC (Role-Based Access Control)**

**Problema**: Sistema básico de roles sem granularidade

**Solução**:
```typescript
// src/types/rbac.ts
export type Role = 'viewer' | 'editor' | 'admin' | 'super_admin';
export type Permission = 
  | 'read:dashboard'
  | 'write:cadastral'
  | 'read:financial'
  | 'approve:loans'
  | 'manage:users'
  | 'view:audit_logs';

export const rolePermissions: Record<Role, Permission[]> = {
  viewer: ['read:dashboard', 'read:financial'],
  editor: ['read:dashboard', 'read:financial', 'write:cadastral'],
  admin: ['read:dashboard', 'write:cadastral', 'manage:users', 'view:audit_logs'],
  super_admin: [
    'read:dashboard', 'write:cadastral', 'approve:loans', 
    'manage:users', 'view:audit_logs'
  ]
};

// src/hooks/usePermission.ts
export function usePermission(required: Permission[]): boolean {
  const { user } = useAuth();
  const userPermissions = rolePermissions[user?.role];
  return required.every(p => userPermissions?.includes(p));
}

// Uso em componentes
<PermissionGate permission={['write:cadastral']}>
  <EditButton />
</PermissionGate>
```

**Banco de Dados**:
```sql
-- supabase/migrations/add_rbac.sql
CREATE TABLE roles (
  id UUID PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE permissions (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE role_permissions (
  role_id UUID REFERENCES roles(id),
  permission_id UUID REFERENCES permissions(id),
  PRIMARY KEY (role_id, permission_id)
);

INSERT INTO roles (id, name, description) VALUES
  ('viewer-role', 'Viewer', 'Acesso somente leitura'),
  ('editor-role', 'Editor', 'Acesso para editar dados'),
  ('admin-role', 'Admin', 'Acesso administrativo completo');

-- Vincular permissões aos roles
```

**Checklist**:
- [ ] Criar tabelas de roles e permissions
- [ ] Migrar usuários existentes para novo RBAC
- [ ] Implementar middleware de verificação
- [ ] Testar em staging
- [ ] Documentar matriz RACI

---

#### **1.4 - Implementar Rate Limiting**

**Solução**:
```typescript
// src/middleware/rate-limit.ts
import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por janela
  message: 'Muitas requisições, tente novamente mais tarde',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Não aplicar rate limit em health checks
    return req.path === '/health';
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 tentativas de login
  skipSuccessfulRequests: true,
});

// server.js
app.use('/api/', apiLimiter);
app.post('/auth/login', authLimiter, loginHandler);
```

**Checklist**:
- [ ] Instalar express-rate-limit
- [ ] Aplicar a todas as APIs públicas
- [ ] Usar Redis para rate limit distribuído
- [ ] Testar comportamento sob carga

---

### **FASE 2: CRIPTOGRAFIA E PROTEÇÃO (Semanas 5-8)**

#### **2.1 - Criptografia em Repouso (At-Rest)**

**Problema**: Dados sensíveis armazenados em plaintext no BD

**Solução**:
```typescript
// src/services/encryption-service.ts
import crypto from 'crypto';

export class EncryptionService {
  private algorithm = 'aes-256-gcm';
  private keyLength = 32;

  constructor(private masterKey: string) {}

  encrypt(plaintext: string): { ciphertext: string; iv: string; authTag: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, Buffer.from(this.masterKey), iv);
    
    let ciphertext = cipher.update(plaintext, 'utf-8', 'hex');
    ciphertext += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();

    return {
      ciphertext,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
    };
  }

  decrypt(encrypted: { ciphertext: string; iv: string; authTag: string }): string {
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      Buffer.from(this.masterKey),
      Buffer.from(encrypted.iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(encrypted.authTag, 'hex'));

    let plaintext = decipher.update(encrypted.ciphertext, 'hex', 'utf-8');
    plaintext += decipher.final('utf-8');

    return plaintext;
  }
}

// Uso
const encryption = new EncryptionService(process.env.MASTER_KEY!);

// Criptografar dados sensíveis antes de salvar
const encrypted = encryption.encrypt(cpf);
await db.clients.insert({
  cpf: encrypted.ciphertext,
  iv: encrypted.iv,
  authTag: encrypted.authTag,
});

// Descriptografar ao ler
const decrypted = encryption.decrypt({
  ciphertext: client.cpf,
  iv: client.iv,
  authTag: client.authTag,
});
```

**Dados Sensíveis a Criptografar**:
- CPF/CNPJ
- Dados Bancários
- Senhas
- Tokens
- Informações Pessoais (PII)

**Checklist**:
- [ ] Identificar campos sensíveis
- [ ] Implementar EncryptionService
- [ ] Adicionar migrations para criptografar dados existentes
- [ ] Testar decrypt/encrypt
- [ ] Documentar chave mestra (backup seguro)

---

#### **2.2 - Criptografia em Trânsito (TLS)**

**Solução**:
```javascript
// server.js - Force HTTPS
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync(process.env.TLS_KEY_PATH),
  cert: fs.readFileSync(process.env.TLS_CERT_PATH),
};

https.createServer(options, app).listen(3001);

// Middleware para redirecionar HTTP -> HTTPS
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !req.secure) {
    return res.redirect(301, `https://${req.host}${req.url}`);
  }
  next();
});

// HSTS - Force HTTPS por 1 ano
app.use((req, res, next) => {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  next();
});
```

**Configuração Nginx**:
```nginx
# docker/nginx.conf
server {
  listen 443 ssl http2;
  server_name delta-navigator.com;

  ssl_certificate /etc/nginx/certs/cert.pem;
  ssl_certificate_key /etc/nginx/certs/key.pem;

  # TLS 1.2 minimum
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_ciphers HIGH:!aNULL:!MD5;
  ssl_prefer_server_ciphers on;

  # HSTS
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload";
  
  # CSP
  add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'";

  location / {
    proxy_pass http://frontend:3000;
  }

  location /api {
    proxy_pass http://backend:3001;
  }
}
```

**Checklist**:
- [ ] Obter certificado SSL/TLS (Let's Encrypt)
- [ ] Configurar HTTPS em todos os serviços
- [ ] Ativar HSTS
- [ ] Ativar CSP (Content Security Policy)
- [ ] Testar com SSL Labs

---

#### **2.3 - Gestão de Chaves de Criptografia**

**Solução com AWS Secrets Manager**:
```typescript
// src/services/secrets-manager.ts
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const client = new SecretsManagerClient({ region: process.env.AWS_REGION });

export async function getSecret(secretName: string): Promise<string> {
  const command = new GetSecretValueCommand({ SecretId: secretName });
  const result = await client.send(command);
  return result.SecretString!;
}

// Uso
const masterKey = await getSecret('delta-navigator/master-key');
const dbPassword = await getSecret('delta-navigator/db-password');
```

**Ou com Vault**:
```bash
# Instalar Vault localmente
brew install vault

# Iniciar server
vault server -dev

# Adicionar secrets
vault kv put secret/delta-navigator/db password=MyPassword123

# Python/Node podem ler automaticamente
```

**Checklist**:
- [ ] Escolher gerenciador de secrets (AWS/Azure/Vault)
- [ ] Configurar acesso via IAM/RBAC
- [ ] Implementar rotation automática de chaves
- [ ] Auditar acessos a secrets
- [ ] Documentar processo de backup/recovery

---

### **FASE 3: AUDITORIA E CONFORMIDADE (Semanas 9-12)**

#### **3.1 - Expandir Audit Log (Trilha de Auditoria)**

**Problema**: Audit log incompleto

**Solução - Tabela Completa**:
```sql
-- supabase/migrations/comprehensive_audit_log.sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Quem
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  
  -- O que
  action VARCHAR(100) NOT NULL, -- 'CREATE', 'READ', 'UPDATE', 'DELETE'
  resource_type VARCHAR(50) NOT NULL, -- 'user', 'contract', 'financial_data'
  resource_id VARCHAR(255),
  
  -- Valores
  old_values JSONB, -- estado anterior
  new_values JSONB, -- estado novo
  
  -- Status
  status VARCHAR(20) NOT NULL, -- 'SUCCESS', 'FAILED'
  error_message TEXT,
  
  -- Contexto
  session_id VARCHAR(255),
  request_id VARCHAR(255),
  source_system VARCHAR(100),
  
  -- Conformidade
  compliance_relevant BOOLEAN DEFAULT FALSE, -- para relatórios BACEN
  data_classification VARCHAR(20), -- 'PUBLIC', 'INTERNAL', 'CONFIDENTIAL'
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_action ON audit_logs(action);

-- RLS - apenas admin pode ver audit logs
CREATE POLICY "Only admins can view audit logs" ON audit_logs
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'admin' OR 
    auth.jwt() ->> 'role' = 'super_admin'
  );

-- Função para logar automaticamente mudanças
CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id, action, resource_type, resource_id,
    old_values, new_values, status
  ) VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    (NEW).id::TEXT,
    row_to_json(OLD),
    row_to_json(NEW),
    'SUCCESS'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ativar triggers em tabelas críticas
CREATE TRIGGER audit_clients AFTER INSERT OR UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_contracts AFTER INSERT OR UPDATE ON contracts
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_users AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();
```

**Logs de Segurança (Não Modificáveis)**:
```typescript
// src/services/immutable-log.ts
import crypto from 'crypto';

export class ImmutableAuditLog {
  private previousHash: string = 'genesis';

  async appendLog(event: any): Promise<void> {
    // Hash encadeado (blockchain-like)
    const logEntry = JSON.stringify({ ...event, previousHash: this.previousHash });
    const hash = crypto.createHash('sha256').update(logEntry).digest('hex');

    await db.immutable_audit_logs.insert({
      entry: logEntry,
      hash: hash,
      previousHash: this.previousHash,
      timestamp: new Date(),
    });

    this.previousHash = hash;
  }

  // Verificar integridade
  async verifyIntegrity(): Promise<boolean> {
    const logs = await db.immutable_audit_logs.findAll();
    
    for (let i = 0; i < logs.length; i++) {
      const expectedHash = crypto
        .createHash('sha256')
        .update(logs[i].entry)
        .digest('hex');

      if (expectedHash !== logs[i].hash) {
        console.error(`Log ${i} foi modificado!`);
        return false;
      }

      if (i > 0 && logs[i].previousHash !== logs[i-1].hash) {
        console.error(`Integridade quebrada no log ${i}`);
        return false;
      }
    }

    return true;
  }
}
```

**Checklist**:
- [ ] Implementar audit log expandido
- [ ] Logar TODAS as operações CRUD
- [ ] Criptografar logs
- [ ] Implementar log imutável
- [ ] Replicar logs para sistema externo (Splunk/ELK)
- [ ] Retenção mínima 5 anos

---

#### **3.2 - Data Lineage (Origem dos Dados)**

**Solução**:
```typescript
// src/services/data-lineage.ts
export interface DataLineage {
  datasetId: string;
  datasetName: string;
  source: string; // 'DATABASE', 'API', 'UPLOAD', 'MANUAL'
  sourceSystem: string; // 'SQL_SERVER', 'POSTGRES', 'EXTRATO_API'
  ingestionTime: Date;
  transformations: Transformation[];
  owners: string[]; // emails dos responsáveis
  classification: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL';
  retentionDays: number;
  lastModified: Date;
}

export interface Transformation {
  name: string;
  description: string;
  code: string;
  timestamp: Date;
  appliedBy: string;
}

// Registro de lineage
export async function registerDataset(lineage: DataLineage) {
  await db.data_lineage.insert(lineage);
  
  // Logar no audit
  await auditLog.log({
    action: 'REGISTER_DATASET',
    resource: lineage.datasetId,
    details: lineage
  });
}

// Rastrear transformações
export async function logTransformation(
  datasetId: string,
  transformation: Transformation
) {
  await db.data_lineage.update(datasetId, {
    transformations: [
      ...existingLineage.transformations,
      transformation
    ]
  });
}
```

**Banco de Dados**:
```sql
CREATE TABLE data_lineage (
  id UUID PRIMARY KEY,
  dataset_id VARCHAR(255) NOT NULL UNIQUE,
  dataset_name VARCHAR(255) NOT NULL,
  source VARCHAR(50), -- 'DATABASE', 'API', 'UPLOAD'
  source_system VARCHAR(100),
  ingestion_time TIMESTAMP,
  classification VARCHAR(20), -- 'PUBLIC', 'INTERNAL', 'CONFIDENTIAL'
  retention_days INTEGER,
  owners TEXT[], -- array de emails
  documentation TEXT,
  quality_score DECIMAL(3,2), -- 0.0 a 1.0
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Data Quality Metrics
CREATE TABLE data_quality_metrics (
  id UUID PRIMARY KEY,
  dataset_id VARCHAR(255) REFERENCES data_lineage(dataset_id),
  metric_name VARCHAR(100),
  metric_value DECIMAL,
  check_timestamp TIMESTAMP,
  status VARCHAR(20) -- 'PASS', 'WARN', 'FAIL'
);
```

**Checklist**:
- [ ] Documentar origem de cada dataset
- [ ] Registrar transformações
- [ ] Rastrear linhagem de cálculos
- [ ] Criar visualização de lineage (data lineage graph)
- [ ] Documentar owner de cada dataset

---

#### **3.3 - Data Quality Framework**

**Solução**:
```typescript
// src/services/data-quality.ts
export interface QualityRule {
  name: string;
  field: string;
  rule: 'NOT_NULL' | 'UNIQUE' | 'RANGE' | 'FORMAT' | 'CUSTOM';
  config: any;
  severity: 'ERROR' | 'WARNING';
}

export class DataQualityService {
  private rules: Map<string, QualityRule[]> = new Map();

  registerRules(entity: string, rules: QualityRule[]) {
    this.rules.set(entity, rules);
  }

  async validateRecord(entity: string, record: any): Promise<ValidationResult> {
    const rules = this.rules.get(entity) || [];
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const rule of rules) {
      const value = record[rule.field];

      switch (rule.rule) {
        case 'NOT_NULL':
          if (value === null || value === undefined) {
            const msg = `Campo ${rule.field} é obrigatório`;
            if (rule.severity === 'ERROR') errors.push(msg);
            else warnings.push(msg);
          }
          break;

        case 'FORMAT':
          if (!new RegExp(rule.config.pattern).test(value)) {
            const msg = `Campo ${rule.field} tem formato inválido`;
            if (rule.severity === 'ERROR') errors.push(msg);
            else warnings.push(msg);
          }
          break;

        case 'RANGE':
          if (value < rule.config.min || value > rule.config.max) {
            const msg = `Campo ${rule.field} fora do intervalo`;
            if (rule.severity === 'ERROR') errors.push(msg);
            else warnings.push(msg);
          }
          break;
      }
    }

    return { isValid: errors.length === 0, errors, warnings };
  }
}

// Uso
const dq = new DataQualityService();

dq.registerRules('clients', [
  { name: 'CPF required', field: 'cpf', rule: 'NOT_NULL', severity: 'ERROR' },
  {
    name: 'Valid CPF format',
    field: 'cpf',
    rule: 'FORMAT',
    config: { pattern: '^\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2}$' },
    severity: 'ERROR'
  },
  {
    name: 'Credit limit range',
    field: 'credit_limit',
    rule: 'RANGE',
    config: { min: 0, max: 1000000 },
    severity: 'WARNING'
  }
]);

// Validar antes de inserir
const validation = await dq.validateRecord('clients', newClient);
if (!validation.isValid) {
  throw new Error(`Dados inválidos: ${validation.errors.join(', ')}`);
}
```

**Checklist**:
- [ ] Definir regras de qualidade por entidade
- [ ] Implementar validação automática
- [ ] Dashboard de qualidade de dados
- [ ] Alertas para dados de baixa qualidade
- [ ] Relatório mensal para BACEN

---

### **FASE 4: GOVERNANÇA DE DADOS (Semanas 13-16)**

#### **4.1 - Política de Retenção de Dados**

**Documento Formal**:
```markdown
# Política de Retenção de Dados - Delta Navigator

## 1. Dados de Clientes
- **Retenção**: 5 anos pós-encerramento
- **Base Legal**: Resolução BACEN 4.893/2021
- **Destruição**: Irrecuperável após período

## 2. Dados Transacionais (Contratos, Faturas)
- **Retenção**: 5 anos pós-vencimento
- **Base Legal**: Lei 8.078/1990 (Código de Defesa do Consumidor)
- **Acesso**: Auditado, com justificativa

## 3. Logs de Segurança
- **Retenção**: 7 anos
- **Base Legal**: Circular BACEN 3.909/2019
- **Armazenamento**: Imutável, encriptado

## 4. Dados Pessoais (LGPD)
- **Retenção**: Conforme consentimento do titular
- **Direito ao Esquecimento**: 30 dias para exclusão
- **Notificação**: 72h em caso de breach

## 5. Dados de Teste/Desenvolvimento
- **Retenção**: Máximo 90 dias
- **Política**: Usar dados mascarados (não reais)
- **Exclusão**: Automática após período
```

**Implementação Técnica**:
```typescript
// src/services/data-retention.ts
export interface RetentionPolicy {
  entityType: string;
  retentionDays: number;
  baseLegal: string;
  actionOnExpiry: 'DELETE' | 'ARCHIVE';
  archiveLocation?: string;
}

const retentionPolicies: RetentionPolicy[] = [
  {
    entityType: 'clients',
    retentionDays: 1825, // 5 anos
    baseLegal: 'Resolução BACEN 4.893/2021',
    actionOnExpiry: 'ARCHIVE',
    archiveLocation: 's3://archive-bucket/clients/'
  },
  {
    entityType: 'transactions',
    retentionDays: 1825,
    baseLegal: 'Lei 8.078/1990',
    actionOnExpiry: 'ARCHIVE',
  },
  {
    entityType: 'security_logs',
    retentionDays: 2555, // 7 anos
    baseLegal: 'Circular BACEN 3.909/2019',
    actionOnExpiry: 'ARCHIVE',
  }
];

// Job agendado para limpar dados expirados
export async function executeRetentionPolicy() {
  const now = new Date();

  for (const policy of retentionPolicies) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() - policy.retentionDays);

    const expiredRecords = await db[policy.entityType].findMany({
      where: { created_at: { lt: expiryDate } }
    });

    if (policy.actionOnExpiry === 'ARCHIVE') {
      // Enviar para arquivo (S3, etc)
      await archiveRecords(policy.entityType, expiredRecords);
      
      // Logar
      await auditLog.log({
        action: 'DATA_ARCHIVED',
        resource: policy.entityType,
        count: expiredRecords.length,
        reason: `Retenção de ${policy.retentionDays} dias expirada`
      });
    } else if (policy.actionOnExpiry === 'DELETE') {
      // Deletar (com criptografia de chave master)
      await secureDelete(policy.entityType, expiredRecords);
    }
  }
}

// Executar diariamente
schedule.scheduleJob('0 2 * * *', executeRetentionPolicy);
```

**Checklist**:
- [ ] Documentar política formal
- [ ] Implementar job de retenção automático
- [ ] Testar arquivamento
- [ ] Configurar backup de arquivo
- [ ] Notificar usuários sobre retenção

---

#### **4.2 - Data Protection Impact Assessment (DPIA)**

**Documento Obrigatório para Sistemas LGPD**:
```markdown
# DPIA - Processamento de Dados Financeiros

## 1. Descrição do Processamento
- **Titular**: Pessoas Física (clientes)
- **Categorias de Dados**: CPF, CNPJ, histórico financeiro, crédito
- **Finalidade**: Concessão de crédito, análise de risco
- **Base Legal**: Artigo 7º, II LGPD (contrato)

## 2. Risco de Violação de Direitos
- **Risco**: Exposição de dados financeiros sensíveis
- **Impacto**: Financeiro, reputacional, legal
- **Probabilidade**: BAIXA (com medidas implementadas)

## 3. Medidas de Mitigação
- Encriptação AES-256 de dados sensíveis
- RBAC com segregação de funções
- Audit log imutável
- MFA obrigatória para admin
- Teste de penetração anual

## 4. Direitos do Titular
- ✅ Acesso: API de exportação de dados
- ✅ Retificação: Via formulário
- ✅ Esquecimento: Processo de 30 dias
- ✅ Portabilidade: JSON/CSV

## 5. Contato DPO
- Nome: [DPO Designado]
- Email: dpo@delta-navigator.com
- Telefone: [+55 XX XXXX-XXXX]
```

**Checklist**:
- [ ] Designar DPO formalmente
- [ ] Completar DPIA
- [ ] Obter aprovação Legal
- [ ] Registrar no Registro de Processamento
- [ ] Revisar anualmente

---

#### **4.3 - Classificação de Dados**

**Sistema de Classificação**:
```sql
-- Tabela de classificação
CREATE TABLE data_classification (
  id UUID PRIMARY KEY,
  field_path VARCHAR(255), -- ex: 'clients.cpf'
  table_name VARCHAR(100),
  column_name VARCHAR(100),
  classification VARCHAR(20) NOT NULL, -- 'PUBLIC', 'INTERNAL', 'CONFIDENTIAL'
  encryption_required BOOLEAN,
  pii BOOLEAN, -- Personally Identifiable Information
  requires_consent BOOLEAN,
  anonymization_required BOOLEAN,
  created_at TIMESTAMP,
  UNIQUE(table_name, column_name)
);

INSERT INTO data_classification VALUES
  ('clients', 'cpf', 'CONFIDENTIAL', true, true, true, true),
  ('clients', 'cnpj', 'CONFIDENTIAL', true, true, true, true),
  ('clients', 'nome', 'INTERNAL', false, true, false, true),
  ('clients', 'email', 'INTERNAL', false, true, true, true),
  ('contracts', 'amount', 'INTERNAL', false, false, false, false),
  ('contracts', 'status', 'PUBLIC', false, false, false, false);

-- Função para obter classificação
CREATE OR REPLACE FUNCTION get_data_classification(
  p_table VARCHAR, 
  p_column VARCHAR
) RETURNS VARCHAR AS $$
  SELECT classification FROM data_classification 
  WHERE table_name = p_table AND column_name = p_column
$$ LANGUAGE SQL;
```

**Aplicação no Backend**:
```typescript
// Middleware para validar acesso a dados classificados
export async function classificationMiddleware(req, res, next) {
  const userRole = req.user.role;
  const requestedFields = extractFields(req.query);

  for (const field of requestedFields) {
    const classification = await getDataClassification(field.table, field.column);

    // CONFIDENTIAL: apenas admin e super_admin
    if (classification === 'CONFIDENTIAL' && !['admin', 'super_admin'].includes(userRole)) {
      return res.status(403).json({ error: 'Acesso negado a dados confidenciais' });
    }

    // INTERNAL: apenas usuários autenticados
    if (classification === 'INTERNAL' && !req.user) {
      return res.status(401).json({ error: 'Autenticação necessária' });
    }

    // Logar acesso
    await auditLog.log({
      action: 'ACCESS_CLASSIFIED_DATA',
      field: `${field.table}.${field.column}`,
      classification: classification,
      user: req.user.id,
      timestamp: new Date()
    });
  }

  next();
}
```

**Checklist**:
- [ ] Classificar todos os campos
- [ ] Documentar matriz de acesso
- [ ] Implementar enforcement no código
- [ ] Testar acesso não autorizado
- [ ] Atualizar quando houver novos campos

---

## 📋 **Checklist de Conformidade**

### **SEGURANÇA**

- [ ] Remover hardcoded credentials
- [ ] CORS configurado restritivamente
- [ ] RBAC implementado
- [ ] Rate limiting ativo
- [ ] Criptografia em repouso
- [ ] Criptografia em trânsito (TLS 1.2+)
- [ ] Gestão de chaves centralizada
- [ ] Senhas com bcrypt/argon2
- [ ] MFA para admin
- [ ] WAF configurado (AWS WAF, Cloudflare, etc)

### **AUDITORIA**

- [ ] Audit log expandido
- [ ] Logs imutáveis
- [ ] Replicação de logs para SIEM
- [ ] Alertas de segurança em tempo real
- [ ] Monitoramento 24/7
- [ ] Testes de penetração anuais
- [ ] Verificação de vulnerabilidades (SAST/DAST)
- [ ] Backup de logs

### **GOVERNANÇA**

- [ ] Data lineage documentada
- [ ] Data quality framework implementado
- [ ] Política de retenção formal
- [ ] DPIA completado
- [ ] Classificação de dados
- [ ] DPO designado
- [ ] Registro de processamento atualizado
- [ ] Direitos do titular implementados (acesso, exclusão, portabilidade)

### **CONFORMIDADE REGULATÓRIA**

- [ ] Resolução BACEN 4.658/2018 (Infraestrutura)
- [ ] Resolução BACEN 4.893/2021 (Segurança)
- [ ] Instrução Normativa BACEN 162/2021 (Controles)
- [ ] Lei Geral de Proteção de Dados (LGPD)
- [ ] Resolução BACEN 4.860/2020 (Open Banking)
- [ ] Circular BACEN 4.068/2021 (Governança)

### **OPERACIONAL**

- [ ] Disaster Recovery Plan (DRP)
- [ ] Business Continuity Plan (BCP)
- [ ] Change Management Policy
- [ ] Segregação de ambientes (dev/staging/prod)
- [ ] Documentação de arquitetura
- [ ] Runbooks de operação
- [ ] Testes de failover
- [ ] Backup geograficamente distribuído

---

## 🚀 **Timeline de Implementação**

| Fase | Semanas | Atividades | Responsável |
|------|---------|-----------|------------|
| **1. Segurança Crítica** | 1-4 | Credenciais, CORS, RBAC, Rate Limit | DevSecOps |
| **2. Criptografia** | 5-8 | Dados em repouso, TLS, Gestão de chaves | Arquitetura |
| **3. Auditoria** | 9-12 | Audit log, Lineage, Data Quality | Engenharia |
| **4. Governança** | 13-16 | Retenção, DPIA, Classificação | Compliance |
| **5. Certificação** | 17-20 | Testes finais, Documentação, Auditoria | Execução |

---

## 💰 **Estimativa de Esforço**

| Item | Horas | Custo (R$) |
|------|-------|-----------|
| Segurança Crítica | 80 | R$ 16.000 |
| Criptografia | 120 | R$ 24.000 |
| Auditoria | 100 | R$ 20.000 |
| Governança | 90 | R$ 18.000 |
| Testes & QA | 100 | R$ 20.000 |
| **Total** | **490** | **R$ 98.000** |

---

## 📚 **Referências Normativas**

1. **Resolução BACEN 4.658/2018** - Infraestrutura de TI
   - https://www.bcb.gov.br/nor/4658

2. **Resolução BACEN 4.893/2021** - Segurança da Informação
   - https://www.bcb.gov.br/nor/4893

3. **Instrução Normativa BACEN 162/2021** - Controles Internos
   - https://www.bcb.gov.br/nor/162

4. **Lei 13.709/2018** - Lei Geral de Proteção de Dados (LGPD)
   - https://www.gov.br/cidadania/pt-br/acesso-a-informacao/lgpd

5. **Circular BACEN 4.068/2021** - Governança de Dados
   - https://www.bcb.gov.br/circ/4068

6. **Resolução BACEN 4.860/2020** - Open Banking
   - https://www.bcb.gov.br/nor/4860

---

## 👥 **Próximas Ações**

1. **Reunião de Kickoff** - Alinhamento com stakeholders
2. **Nomeação de DPO** - Oficial de Proteção de Dados
3. **Auditoria de Segurança** - Avaliação inicial
4. **Aprovação de Budget** - Recurso financeiro
5. **Sprint Planning** - Detalhamento das FASE 1

---

**Documento preparado para compliance BACEN**  
**Última atualização**: 25 de Novembro de 2025  
**Versão**: 1.0
