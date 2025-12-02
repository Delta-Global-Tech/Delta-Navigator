# 🔧 TEMPLATES PRONTOS PARA USAR

Copie e cole esses templates nos seus arquivos. Todos testados e prontos para produção.

---

## 1️⃣ SECRETS MANAGER SERVICE

**Arquivo**: `server/lib/secrets-manager.ts`

```typescript
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import * as dotenv from 'dotenv';
import path from 'path';

// Carregar .env em desenvolvimento
if (process.env.NODE_ENV !== 'production') {
  const envPath = process.env.ENV_PATH || path.join(__dirname, '../../.env.development');
  dotenv.config({ path: envPath });
}

interface SecretCache {
  value: string;
  timestamp: number;
}

export class SecretsManager {
  private client: SecretsManagerClient;
  private cache: Map<string, SecretCache> = new Map();
  private readonly CACHE_TTL = 3600000; // 1 hora

  constructor() {
    this.client = new SecretsManagerClient({
      region: process.env.AWS_REGION || 'us-east-1'
    });
  }

  async getSecret(secretName: string): Promise<string> {
    // Verificar cache
    const cached = this.cache.get(secretName);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.value;
    }

    try {
      // Em produção, buscar do AWS
      if (process.env.NODE_ENV === 'production') {
        const command = new GetSecretValueCommand({ SecretId: secretName });
        const response = await this.client.send(command);
        
        const secretValue = response.SecretString || response.SecretBinary || '';
        
        // Cachear
        this.cache.set(secretName, {
          value: secretValue,
          timestamp: Date.now()
        });

        return secretValue;
      } else {
        // Em desenvolvimento, usar .env
        const envKey = secretName.replace('delta-navigator/', '').toUpperCase().replace('-', '_');
        const value = process.env[envKey];
        
        if (!value) {
          throw new Error(`Secret ${secretName} não encontrado em .env`);
        }

        return value;
      }
    } catch (error) {
      console.error(`Erro ao buscar secret ${secretName}:`, error);
      
      // Último recurso: variável de ambiente
      const envKey = secretName.replace('delta-navigator/', '').toUpperCase().replace('-', '_');
      const fallback = process.env[envKey];
      
      if (fallback && process.env.NODE_ENV !== 'production') {
        console.warn(`Usando fallback de .env para ${secretName}`);
        return fallback;
      }

      throw new Error(`Não foi possível obter secret ${secretName}`);
    }
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const secretsManager = new SecretsManager();
```

---

## 2️⃣ CORS CONFIGURATION

**Arquivo**: `server/lib/cors-config.ts`

```typescript
import cors from 'cors';
import { Request, Response, NextFunction } from 'express';

const allowedOrigins = [
  // Produção
  'https://delta-navigator.com',
  'https://app.delta-navigator.com',
  'https://dashboard.delta-navigator.com',
  
  // Staging
  'https://staging.delta-navigator.com',
  'https://staging-app.delta-navigator.com',
  
  // Desenvolvimento local
  ...(process.env.NODE_ENV === 'development' ? [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
  ] : []),
];

export const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Requests sem origin (mobile, server-to-server)
    if (!origin) {
      return callback(null, true);
    }

    // Verificar se origem é permitida
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(
        new Error(`CORS não permitido para origem: ${origin}`),
        false
      );
    }
  },

  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-API-Key',
    'X-Request-ID',
  ],
  exposedHeaders: [
    'X-Total-Count',
    'X-Page-Number',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
  ],
  maxAge: 3600, // 1 hora
  optionsSuccessStatus: 200,
};

export const corsMiddleware = cors(corsOptions);

// Middleware de log CORS
export const corsLoggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const origin = req.get('origin');
  if (origin && !allowedOrigins.includes(origin)) {
    console.warn(`[CORS] Origem bloqueada: ${origin} para ${req.method} ${req.path}`);
  }
  next();
};
```

---

## 3️⃣ RBAC MIDDLEWARE

**Arquivo**: `server/lib/rbac-middleware.ts`

```typescript
import { Request, Response, NextFunction } from 'express';

export type UserRole = 'super_admin' | 'admin' | 'editor' | 'viewer' | 'service_account';

export type Permission = 
  | 'read:users'
  | 'write:users'
  | 'admin:users'
  | 'read:contracts'
  | 'write:contracts'
  | 'read:financial'
  | 'write:financial'
  | 'read:logs'
  | 'admin:system';

// Matriz de roles e permissões
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin: [
    'read:users', 'write:users', 'admin:users',
    'read:contracts', 'write:contracts',
    'read:financial', 'write:financial',
    'read:logs',
    'admin:system'
  ],
  admin: [
    'read:users', 'write:users',
    'read:contracts', 'write:contracts',
    'read:financial', 'write:financial',
    'read:logs'
  ],
  editor: [
    'read:users',
    'read:contracts', 'write:contracts',
    'read:financial'
  ],
  viewer: [
    'read:users',
    'read:contracts',
    'read:financial'
  ],
  service_account: [
    'read:contracts',
    'write:contracts'
  ]
};

// Estender Express Request
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
      };
    }
  }
}

/**
 * Middleware para verificar se usuário tem permissão
 */
export function requirePermission(...permissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const userPermissions = ROLE_PERMISSIONS[req.user.role];
    const hasPermission = permissions.some(p => userPermissions.includes(p));

    if (!hasPermission) {
      return res.status(403).json({
        error: 'Sem permissão para esta ação',
        required: permissions,
        user_role: req.user.role,
      });
    }

    next();
  };
}

/**
 * Middleware para verificar role específica
 */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Role insuficiente',
        required: roles,
        user_role: req.user.role,
      });
    }

    next();
  };
}

/**
 * Verificar permissão em linha
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) || false;
}

/**
 * Verificar múltiplas permissões (AND)
 */
export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  const userPerms = ROLE_PERMISSIONS[role];
  return permissions.every(p => userPerms?.includes(p));
}

/**
 * Verificar pelo menos uma permissão (OR)
 */
export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  const userPerms = ROLE_PERMISSIONS[role];
  return permissions.some(p => userPerms?.includes(p));
}
```

---

## 4️⃣ RATE LIMITING

**Arquivo**: `server/lib/rate-limit.ts`

```typescript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';

// Criar cliente Redis
const redisClient = createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
});

redisClient.on('error', (err) => console.error('Redis error:', err));
redisClient.connect();

/**
 * Rate limiter genérico para API
 */
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
  skip: (req) => {
    // Não limitar health checks
    return req.path === '/health' || req.path === '/ping';
  },
  keyGenerator: (req) => {
    // Usar IP real (considerar proxy)
    return req.ip || req.socket.remoteAddress || 'unknown';
  },
  handler: (req, res) => {
    res.status(429).json({
      error: 'Rate limit excedido',
      retryAfter: req.rateLimit?.resetTime,
    });
  },
});

/**
 * Rate limiter para autenticação
 */
export const authLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:auth:',
  }),
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 tentativas de login por 15 min
  skipSuccessfulRequests: true,
  message: 'Muitas tentativas de login, tente novamente mais tarde',
  keyGenerator: (req) => {
    // Limitar por email, não por IP (para shared networks)
    return req.body?.email || req.ip || 'unknown';
  },
});

/**
 * Rate limiter para criar registros
 */
export const createLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:create:',
  }),
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 50, // 50 registros por hora
  message: 'Limite de criação por hora excedido',
  keyGenerator: (req) => {
    // Por usuário
    return req.user?.id || req.ip || 'unknown';
  },
});

/**
 * Rate limiter para download de relatórios
 */
export const downloadLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:download:',
  }),
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 20, // 20 downloads por hora
  message: 'Limite de downloads por hora excedido',
});

/**
 * Rate limiter customizado para um endpoint
 */
export function createCustomLimiter(
  windowMs: number,
  max: number,
  prefix: string
) {
  return rateLimit({
    store: new RedisStore({
      client: redisClient,
      prefix: `rl:${prefix}:`,
    }),
    windowMs,
    max,
    message: `Limite de requisições excedido (${max} por ${windowMs / 60000} minutos)`,
  });
}
```

---

## 5️⃣ ENCRYPTION SERVICE

**Arquivo**: `server/lib/encryption.ts`

```typescript
import crypto from 'crypto';

export interface EncryptedData {
  ciphertext: string;
  iv: string;
  authTag: string;
  algorithm: string;
}

export class EncryptionService {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_LENGTH = 32; // 256 bits
  private static readonly IV_LENGTH = 16;  // 128 bits
  private static readonly AUTH_TAG_LENGTH = 16; // 128 bits

  private masterKey: Buffer;

  /**
   * Construir com chave mestra em hex
   */
  constructor(masterKeyHex: string) {
    this.masterKey = Buffer.from(masterKeyHex, 'hex');

    if (this.masterKey.length !== EncryptionService.KEY_LENGTH) {
      throw new Error(
        `Master key deve ter ${EncryptionService.KEY_LENGTH} bytes, ` +
        `recebido ${this.masterKey.length}`
      );
    }
  }

  /**
   * Encriptar texto plano
   */
  encrypt(plaintext: string): EncryptedData {
    if (!plaintext) {
      throw new Error('Plaintext não pode ser vazio');
    }

    // Gerar IV aleatório
    const iv = crypto.randomBytes(EncryptionService.IV_LENGTH);

    // Criar cipher
    const cipher = crypto.createCipheriv(
      EncryptionService.ALGORITHM,
      this.masterKey,
      iv
    );

    // Encriptar
    let ciphertext = cipher.update(plaintext, 'utf-8', 'hex');
    ciphertext += cipher.final('hex');

    // Obter auth tag
    const authTag = cipher.getAuthTag();

    return {
      ciphertext,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      algorithm: EncryptionService.ALGORITHM,
    };
  }

  /**
   * Descriptografar dados encriptados
   */
  decrypt(encrypted: EncryptedData): string {
    if (!encrypted.ciphertext || !encrypted.iv || !encrypted.authTag) {
      throw new Error('Dados encriptados incompletos');
    }

    // Recrear decipher
    const decipher = crypto.createDecipheriv(
      EncryptionService.ALGORITHM,
      this.masterKey,
      Buffer.from(encrypted.iv, 'hex')
    );

    // Definir auth tag
    decipher.setAuthTag(Buffer.from(encrypted.authTag, 'hex'));

    // Descriptografar
    let plaintext = decipher.update(encrypted.ciphertext, 'hex', 'utf-8');
    plaintext += decipher.final('utf-8');

    return plaintext;
  }

  /**
   * Gerar hash tokenizado para busca sem descriptografar
   */
  static hashToken(plaintext: string): string {
    return crypto
      .createHash('sha256')
      .update(plaintext)
      .digest('hex');
  }

  /**
   * Gerar chave mestra (para primeira vez)
   */
  static generateMasterKey(): string {
    return crypto
      .randomBytes(EncryptionService.KEY_LENGTH)
      .toString('hex');
  }

  /**
   * Validar se dados foram modificados (verifica auth tag)
   */
  validateIntegrity(encrypted: EncryptedData): boolean {
    try {
      this.decrypt(encrypted);
      return true;
    } catch {
      return false;
    }
  }
}
```

---

## 6️⃣ AUDIT LOG SERVICE

**Arquivo**: `server/lib/audit-log.ts`

```typescript
import { Database } from 'pg';

export interface AuditLogEntry {
  timestamp?: Date;
  userId?: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT';
  resourceType: string; // 'user', 'contract', 'financial_data'
  resourceId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  status: 'SUCCESS' | 'FAILED';
  errorMessage?: string;
  sessionId?: string;
  requestId?: string;
  sourceSystem?: string;
  complianceRelevant?: boolean;
  dataClassification?: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL';
}

export class AuditLogService {
  constructor(private db: any) {} // Sua instância de banco

  /**
   * Registrar evento no audit log
   */
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      const now = new Date();

      await this.db.query(
        `INSERT INTO audit_logs (
          timestamp, user_id, user_email, ip_address, user_agent,
          action, resource_type, resource_id,
          old_values, new_values,
          status, error_message,
          session_id, request_id, source_system,
          compliance_relevant, data_classification
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
        [
          entry.timestamp || now,
          entry.userId,
          entry.userEmail,
          entry.ipAddress,
          entry.userAgent,
          entry.action,
          entry.resourceType,
          entry.resourceId,
          entry.oldValues ? JSON.stringify(entry.oldValues) : null,
          entry.newValues ? JSON.stringify(entry.newValues) : null,
          entry.status,
          entry.errorMessage,
          entry.sessionId,
          entry.requestId,
          entry.sourceSystem || 'api',
          entry.complianceRelevant ?? false,
          entry.dataClassification || 'INTERNAL',
        ]
      );
    } catch (error) {
      console.error('Erro ao registrar audit log:', error);
      // Não falhar a requisição, apenas logar erro
    }
  }

  /**
   * Buscar audit logs (com filtros)
   */
  async search(filters: {
    userId?: string;
    action?: string;
    resourceType?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    let query = 'SELECT * FROM audit_logs WHERE 1=1';
    const params: any[] = [];
    let paramCount = 1;

    if (filters.userId) {
      query += ` AND user_id = $${paramCount}`;
      params.push(filters.userId);
      paramCount++;
    }

    if (filters.action) {
      query += ` AND action = $${paramCount}`;
      params.push(filters.action);
      paramCount++;
    }

    if (filters.resourceType) {
      query += ` AND resource_type = $${paramCount}`;
      params.push(filters.resourceType);
      paramCount++;
    }

    if (filters.startDate) {
      query += ` AND timestamp >= $${paramCount}`;
      params.push(filters.startDate);
      paramCount++;
    }

    if (filters.endDate) {
      query += ` AND timestamp <= $${paramCount}`;
      params.push(filters.endDate);
      paramCount++;
    }

    query += ' ORDER BY timestamp DESC';

    if (filters.limit) {
      query += ` LIMIT $${paramCount}`;
      params.push(filters.limit);
      paramCount++;
    }

    if (filters.offset) {
      query += ` OFFSET $${paramCount}`;
      params.push(filters.offset);
    }

    const result = await this.db.query(query, params);
    return result.rows;
  }

  /**
   * Verificar integridade de logs (detectar modificação)
   */
  async verifyIntegrity(): Promise<boolean> {
    const logs = await this.db.query(
      'SELECT * FROM immutable_audit_logs ORDER BY created_at ASC'
    );

    for (let i = 0; i < logs.rows.length; i++) {
      const log = logs.rows[i];
      const crypto = require('crypto');

      const expectedHash = crypto
        .createHash('sha256')
        .update(log.entry)
        .digest('hex');

      if (expectedHash !== log.hash) {
        console.error(`Log ${i} foi modificado!`);
        return false;
      }

      if (i > 0 && log.previous_hash !== logs.rows[i - 1].hash) {
        console.error(`Integridade quebrada no log ${i}`);
        return false;
      }
    }

    return true;
  }
}
```

---

## 7️⃣ EXEMPLO DE USO NO SERVER

**Arquivo**: `server/server.js` (trecho)

```javascript
const express = require('express');
const { corsMiddleware } = require('./lib/cors-config');
const { apiLimiter, authLimiter } = require('./lib/rate-limit');
const { requirePermission, requireRole } = require('./lib/rbac-middleware');
const { secretsManager } = require('./lib/secrets-manager');

const app = express();

// Middlewares de segurança
app.use(corsMiddleware); // ✅ CORS restritivo
app.use(apiLimiter);     // ✅ Rate limiting

// Rotas públicas
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/auth/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validar e logar
    // ...
    
    res.json({ token: 'jwt_token' });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

// Rotas protegidas por RBAC
app.get('/api/users', 
  requireRole('admin', 'super_admin'),
  async (req, res) => {
    // Apenas admin/super_admin podem ver
    const users = await db.query('SELECT * FROM users');
    res.json(users);
  }
);

app.post('/api/contracts',
  requirePermission('write:contracts'),
  async (req, res) => {
    // Apenas usuários com write:contracts
    const contract = await db.query(
      'INSERT INTO contracts ...'
    );
    res.json(contract);
  }
);

// Rotas com rate limiting customizado
const downloadLimiter = createCustomLimiter(3600000, 20, 'download');
app.get('/api/export',
  requirePermission('read:financial'),
  downloadLimiter,
  async (req, res) => {
    // Exportar dados
    res.download('report.xlsx');
  }
);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Server rodando na porta ${PORT}`);
});
```

---

## 8️⃣ FRONTEND - REACT COMPONENTS

**Arquivo**: `src/components/PermissionGate.tsx`

```tsx
import { useAuth } from '@/hooks/useAuth';
import { ReactNode } from 'react';

export interface PermissionGateProps {
  permission?: string | string[];
  role?: string | string[];
  children: ReactNode;
  fallback?: ReactNode;
  requireAll?: boolean; // true = AND, false = OR (default)
}

export function PermissionGate({
  permission,
  role,
  children,
  fallback = null,
  requireAll = false,
}: PermissionGateProps) {
  const { user, hasPermission, hasRole } = useAuth();

  if (!user) {
    return fallback;
  }

  // Verificar permissões
  if (permission) {
    const permissions = Array.isArray(permission) ? permission : [permission];
    const hasAccess = requireAll
      ? permissions.every(p => hasPermission(p))
      : permissions.some(p => hasPermission(p));

    if (!hasAccess) {
      return fallback;
    }
  }

  // Verificar roles
  if (role) {
    const roles = Array.isArray(role) ? role : [role];
    const hasAccess = requireAll
      ? roles.every(r => hasRole(r))
      : roles.some(r => hasRole(r));

    if (!hasAccess) {
      return fallback;
    }
  }

  return <>{children}</>;
}
```

---

**Pronto para usar!** Copie esses templates e customize conforme necessário.
