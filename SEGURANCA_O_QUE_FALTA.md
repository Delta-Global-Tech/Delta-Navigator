# 🏛️ Segurança & Governança - O Que Falta Implementar

**Data**: 25 de Novembro de 2025  
**Status**: Você já tem RBAC, agora vamos completar com o que falta

---

## ✅ O QUE JÁ EXISTE NA SUA PLATAFORMA

```
✅ RBAC (Roles Based Access Control)
   - Master/Admin/User já implementado
   - usePermissions() hook funcional
   - Gerenciamento de usuários na interface

✅ Supabase Auth
   - Autenticação de usuários
   - JWT tokens
   - Supabase RLS (Row Level Security)

✅ Setup básico de segurança
   - user_profiles table
   - role definido por usuário
```

---

## ❌ O QUE FALTA PARA DEIXAR SEGURA E COM GOVERNANÇA

```
❌ 1. AUDIT LOGS (rastreamento de quem acessa o quê)
❌ 2. RATE LIMITING (proteção contra brute force)
❌ 3. SECURITY HEADERS (HTTPS, X-Frame-Options, etc)
❌ 4. VALIDAÇÃO DE ENTRADA (proteger contra SQL injection)
❌ 5. LOGGING DE ERROS (ver o que dá errado)
❌ 6. DOCUMENTAÇÃO LGPD (Política, Termos, DPO)
❌ 7. PERMISSÕES GRANULARES (quem pode fazer O QUÊ exatamente)
```

---

## 🎯 PASSO 1: AUDIT LOGS (Rastreamento Completo)

### 1️⃣ Criar tabela no Supabase

```sql
-- supabase/migrations/create_audit_logs.sql

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  action VARCHAR(255) NOT NULL,           -- ACESSO_LEITURA, EXPORT, DELETE, etc
  resource VARCHAR(255) NOT NULL,         -- proposal, user, report, settings
  resource_id VARCHAR(255),               -- ID do recurso acessado
  status VARCHAR(50) NOT NULL,            -- ALLOWED, DENIED, ERROR
  ip_address INET,
  user_agent TEXT,
  details JSONB,                          -- Dados adicionais
  created_at TIMESTAMP DEFAULT now(),
  
  INDEX idx_user_id (user_id),
  INDEX idx_action (action),
  INDEX idx_resource (resource),
  INDEX idx_created_at (created_at)
);

-- RLS: Todos podem ler seus próprios logs, admin vê tudo
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem seus logs"
ON audit_logs FOR SELECT
USING (auth.uid() = user_id OR
       (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'master');
```

### 2️⃣ Criar serviço de logging

```typescript
// src/services/AuditService.ts

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL!,
  process.env.REACT_APP_SUPABASE_ANON_KEY!
);

export interface AuditLogEntry {
  userId?: string;
  userEmail?: string;
  action: string;
  resource: string;
  resourceId?: string;
  status: 'ALLOWED' | 'DENIED' | 'ERROR';
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
}

export async function logAuditEvent(entry: AuditLogEntry) {
  try {
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        user_id: entry.userId,
        user_email: entry.userEmail,
        action: entry.action,
        resource: entry.resource,
        resource_id: entry.resourceId,
        status: entry.status,
        ip_address: entry.ipAddress,
        user_agent: entry.userAgent,
        details: entry.details,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('❌ Erro ao registrar audit log:', error);
    } else {
      console.log(`✅ Log registrado: ${entry.action}`);
    }
  } catch (error) {
    console.error('❌ Exceção ao logar:', error);
  }
}

// Exemplos de uso:
// logAuditEvent({
//   userId: user.id,
//   userEmail: user.email,
//   action: 'LEITURA_PROPOSTA',
//   resource: 'proposal',
//   resourceId: proposalId,
//   status: 'ALLOWED',
//   ipAddress: req.ip,
//   details: { count: 1, timestamp: new Date() }
// });
```

### 3️⃣ Integrar logging em pontos-chave

```typescript
// src/hooks/useProposals.ts (exemplo)

import { logAuditEvent } from '@/services/AuditService';

export function useProposals() {
  const { user } = useAuth();
  const { userRole } = usePermissions();

  const fetchProposals = async () => {
    try {
      const response = await api.get('/proposals');
      
      // ✅ LOG: Leitura bem-sucedida
      await logAuditEvent({
        userId: user?.id,
        userEmail: user?.email,
        action: 'LEITURA_PROPOSTAS',
        resource: 'proposal',
        status: 'ALLOWED',
        details: { count: response.data.length }
      });

      return response.data;
    } catch (error) {
      // ❌ LOG: Erro na leitura
      await logAuditEvent({
        userId: user?.id,
        userEmail: user?.email,
        action: 'LEITURA_PROPOSTAS',
        resource: 'proposal',
        status: 'ERROR',
        details: { error: error.message }
      });

      throw error;
    }
  };

  const exportProposals = async (format: string) => {
    // ✅ LOG: Export (ação sensível, sempre registrar!)
    await logAuditEvent({
      userId: user?.id,
      userEmail: user?.email,
      action: 'EXPORT_PROPOSTAS',
      resource: 'proposal',
      status: 'ALLOWED',
      details: { format, timestamp: new Date() }
    });

    return api.post('/proposals/export', { format });
  };

  return { fetchProposals, exportProposals };
}
```

---

## 🛡️ PASSO 2: RATE LIMITING (Proteção contra Brute Force)

### 1️⃣ Adicionar biblioteca

```bash
npm install express-rate-limit
```

### 2️⃣ Criar configuração de rate limiting

```typescript
// server/middleware/rateLimiter.ts

import rateLimit from 'express-rate-limit';

// API geral: 100 requisições por 15 minutos
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Muitas requisições, tente novamente mais tarde',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.user?.role === 'master' // Masters não têm limite
});

// Login: máximo 5 tentativas por 15 minutos
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Muitas tentativas de login',
  skipSuccessfulRequests: true // Não conta tentativas bem-sucedidas
});

// Export: máximo 10 por hora (operação pesada)
export const exportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Limite de exports atingido'
});

// Delete/Modificação: máximo 20 por hora
export const modifyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: 'Limite de modificações atingido'
});
```

### 3️⃣ Aplicar nos endpoints

```typescript
// server.js

import { apiLimiter, authLimiter, exportLimiter } from './middleware/rateLimiter';

// Aplicar globalmente
app.use('/api/', apiLimiter);

// Login
app.post('/auth/login', authLimiter, loginHandler);

// Export (operação sensível)
app.get('/api/proposals/export', exportLimiter, exportHandler);

// Modificações (delete, etc)
app.delete('/api/proposals/:id', modifyLimiter, authorize('proposal', 'delete'), deleteHandler);
```

---

## 🔐 PASSO 3: SECURITY HEADERS (Cabeçalhos de Segurança)

### 1️⃣ Middleware de headers

```typescript
// server/middleware/securityHeaders.ts

import { Request, Response, NextFunction } from 'express';

export function securityHeaders() {
  return (req: Request, res: Response, next: NextFunction) => {
    // 1. HTTPS obrigatório
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
    
    // 2. Previne clickjacking
    res.setHeader('X-Frame-Options', 'DENY');
    
    // 3. Previne MIME sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // 4. Ativa XSS protection
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // 5. Content Security Policy
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
    );
    
    // 6. Referrer Policy
    res.setHeader('Referrer-Policy', 'no-referrer');
    
    // 7. Feature Policy
    res.setHeader(
      'Permissions-Policy',
      'geolocation=(), microphone=(), camera=()'
    );
    
    // 8. Desabilita cache para dados sensíveis
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    next();
  };
}
```

### 2️⃣ Aplicar no servidor

```typescript
// server.js

import { securityHeaders } from './middleware/securityHeaders';

// Aplicar PRIMEIRO (antes de outras rotas)
app.use(securityHeaders());

// Depois HTTPS redirect
app.use((req, res, next) => {
  if (req.header('x-forwarded-proto') !== 'https' && process.env.NODE_ENV === 'production') {
    res.redirect(`https://${req.header('host')}${req.url}`);
  } else {
    next();
  }
});
```

---

## ✔️ PASSO 4: VALIDAÇÃO DE ENTRADA

### 1️⃣ Instalar biblioteca

```bash
npm install express-validator
```

### 2️⃣ Criar validadores reutilizáveis

```typescript
// server/validators/index.ts

import { body, param, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

// Validar UUID
export const validateUUID = param('id')
  .isUUID()
  .withMessage('ID inválido');

// Validar email
export const validateEmail = body('email')
  .isEmail()
  .normalizeEmail();

// Validar data
export const validateDateRange = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Data de início inválida'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Data de fim inválida')
];

// Validar formato de export
export const validateExportFormat = body('format')
  .isIn(['csv', 'pdf', 'xlsx'])
  .withMessage('Formato inválido (csv, pdf ou xlsx)');

// Middleware para capturar erros de validação
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Dados inválidos',
      details: errors.array()
    });
  }
  next();
};
```

### 3️⃣ Usar em rotas

```typescript
// server.js

import {
  validateUUID,
  validateEmail,
  handleValidationErrors,
  validateExportFormat
} from './validators';

// GET /api/proposals/:id
app.get('/api/proposals/:id',
  validateUUID,
  handleValidationErrors,
  authorize('proposal', 'read'),
  getProposalHandler
);

// POST /api/proposals/export
app.post('/api/proposals/export',
  validateExportFormat,
  handleValidationErrors,
  authorize('proposal', 'export'),
  exportHandler
);
```

---

## 📋 PASSO 5: PERMISSÕES GRANULARES (O que está faltando?)

Verifique no seu código qual é a estrutura atual de permissões. Se for apenas Master/Admin/User, você pode expandir para:

```typescript
// src/types/permissions.ts

export enum Permission {
  // Propostas
  READ_PROPOSAL = 'read:proposal',
  CREATE_PROPOSAL = 'create:proposal',
  UPDATE_PROPOSAL = 'update:proposal',
  DELETE_PROPOSAL = 'delete:proposal',
  EXPORT_PROPOSAL = 'export:proposal',
  
  // Relatórios
  READ_REPORT = 'read:report',
  CREATE_REPORT = 'create:report',
  EXPORT_REPORT = 'export:report',
  
  // Usuários
  READ_USER = 'read:user',
  CREATE_USER = 'create:user',
  UPDATE_USER = 'update:user',
  DELETE_USER = 'delete:user',
  
  // Configurações
  READ_SETTINGS = 'read:settings',
  UPDATE_SETTINGS = 'update:settings',
  
  // Audit
  READ_AUDIT = 'read:audit',
  
  // Admin
  ADMIN_SYSTEM = 'admin:system'
}

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  master: Object.values(Permission), // Tudo
  
  admin: [
    Permission.READ_PROPOSAL,
    Permission.CREATE_PROPOSAL,
    Permission.UPDATE_PROPOSAL,
    Permission.EXPORT_PROPOSAL,
    Permission.READ_REPORT,
    Permission.CREATE_REPORT,
    Permission.EXPORT_REPORT,
    Permission.READ_USER,
    Permission.READ_AUDIT
  ],
  
  user: [
    Permission.READ_PROPOSAL,
    Permission.READ_REPORT,
    Permission.READ_USER
  ]
};
```

---

## 📝 PASSO 6: DOCUMENTAÇÃO LGPD

### Criar 3 arquivos na raiz:

#### 1️⃣ POLITICA_PRIVACIDADE.md

```markdown
# Política de Privacidade - Delta Navigator

**Data de Efetividade**: 25 de Novembro de 2025

## 1. Controlador de Dados
- **Empresa**: Delta Global Dados
- **E-mail de contato**: [seu e-mail]
- **DPO (Data Protection Officer)**: [Nome] ([email])

## 2. Dados que Coletamos
- Identificação (nome, CPF, e-mail)
- Dados financeiros (renda, valores)
- Dados de atividade (quando acessa, o quê vê)

## 3. Base Legal (LGPD Art. 7)
✅ Consentimento do titular
✅ Execução de contrato
✅ Obrigação legal
✅ Interesse legítimo

## 4. Direitos do Titular
O usuário pode:
- ✅ Acessar seus dados
- ✅ Corrigir dados incorretos
- ✅ Deletar seus dados
- ✅ Exportar seus dados (portabilidade)
- ✅ Revogar consentimento

## 5. Segurança
- Encriptação em trânsito (HTTPS)
- Controle de acesso (RBAC)
- Audit logs de acessos
- Testes de segurança regulares

## 6. Retenção de Dados
- Dados do usuário: 2 anos após última atividade
- Audit logs: 5 anos
- Backups: 7 anos

## 7. ANPD
Reclamações: https://www.gov.br/cidadania/pt-br/acesso-a-informacao/lgpd/
```

#### 2️⃣ TERMOS_USO.md

```markdown
# Termos de Uso - Delta Navigator

**Última atualização**: 25 de Novembro de 2025

## 1. Aceitação
Ao usar esta plataforma, você aceita estes termos.

## 2. Responsabilidades Suas
- ✅ Manter sua senha confidencial
- ✅ Não compartilhar sua conta
- ✅ Reportar acesso não autorizado
- ✅ Usar plataforma conforme permitido

## 3. Responsabilidades Nossa
- ✅ Manter dados seguros
- ✅ Disponibilidade 99%
- ✅ Suporte técnico
- ✅ Conformidade legal

## 4. Proibições
- ❌ Acesso não autorizado
- ❌ Hacking/Cracking
- ❌ Vazamento de dados
- ❌ Uso para fins ilícitos

## 5. Limitação de Responsabilidade
Em nenhuma circunstância a empresa será responsável por danos indiretos.
```

#### 3️⃣ MATRIZ_LGPD.md

```markdown
# Matriz de Conformidade LGPD

## Checklist

### Art. 7 - Base Legal
- [x] Consentimento documentado
- [x] Contrato em vigor
- [x] Interesse legítimo claro

### Art. 13 - Informações ao Titular
- [x] Identidade do controlador
- [x] Finalidade do tratamento
- [x] Direitos do titular
- [x] DPO contacto

### Art. 18-20 - Direitos
- [x] Direito de acesso
- [x] Direito de correção
- [x] Direito de exclusão
- [x] Direito de portabilidade

### Art. 32 - Segurança
- [x] Encriptação
- [x] Controle de acesso
- [x] Audit logs
- [x] Testes de segurança

### Art. 37 - DPO
- [x] DPO nomeado
- [x] Contacto publicado
- [x] Independência

## Status
🟢 **COMPLIANT**
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

- [ ] Criar tabela audit_logs
- [ ] Integrar AuditService em hooks principais
- [ ] Testar logging de ações
- [ ] Adicionar rate limiting
- [ ] Testar rate limiting (tentar 6 logins)
- [ ] Adicionar security headers
- [ ] Testar headers (via curl)
- [ ] Implementar validação de entrada
- [ ] Revisar permissões granulares
- [ ] Criar Política de Privacidade
- [ ] Criar Termos de Uso
- [ ] Criar Matriz LGPD
- [ ] Designar DPO (quem é?)
- [ ] Deploy em staging
- [ ] Teste de segurança

---

## ⏱️ TEMPO ESTIMADO

```
- Audit logs: 1-2 horas
- Rate limiting: 30 min
- Security headers: 15 min
- Validação: 1 hora
- Documentação: 1-2 horas

TOTAL: 4-6 horas
```

---

## 🎯 Próximos Passos

1. **Qual desses você quer implementar PRIMEIRO?**
   - Audit logs (rastrear tudo)?
   - Rate limiting (proteger contra brute force)?
   - Security headers (proteger dados em trânsito)?
   - Documentação LGPD (conformidade legal)?

2. **Quem será o DPO (Data Protection Officer)?**
   - Seu nome?
   - E-mail?

Avisa qual começa! 🚀
