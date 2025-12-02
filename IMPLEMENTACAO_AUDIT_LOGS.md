# 🔍 Implementação de Audit Logs - Guia Prático

**Data**: 25 de Novembro de 2025  
**Objetivo**: Rastrear TUDO que acontece na plataforma  
**Tempo Estimado**: 2-3 horas

---

## 📋 O QUE VAI FAZER

```
✅ Criar tabela audit_logs no Supabase
✅ Criar AuditService (serviço de logging)
✅ Registrar TODAS as ações importantes
✅ Interface para visualizar logs
✅ Testes
```

---

## 🚀 PASSO 1: Criar Tabela no Supabase

### 1️⃣ Acessar Supabase

```
1. Abra: https://app.supabase.com
2. Projeto: Delta Navigator
3. SQL Editor → "New Query"
```

### 2️⃣ Copiar e colar este SQL:

```sql
-- ============================================
-- Criar tabela de audit logs
-- ============================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Usuário que fez a ação
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT NOT NULL,
  user_name TEXT,
  user_role TEXT,
  
  -- Ação realizada
  action VARCHAR(255) NOT NULL,              -- LEITURA_PROPOSTA, EXPORT, DELETE_USER, etc
  resource VARCHAR(100) NOT NULL,            -- proposal, user, report, settings
  resource_id VARCHAR(255),                  -- ID específico (proposta_123, user_456, etc)
  
  -- Resultado da ação
  status VARCHAR(50) NOT NULL,               -- ALLOWED, DENIED, ERROR, SUCCESS
  error_message TEXT,                        -- Se houver erro
  
  -- Dados da requisição
  ip_address INET,                           -- IP do usuário
  user_agent TEXT,                           -- Browser/Device
  request_path VARCHAR(500),                 -- /api/proposals, /api/users, etc
  request_method VARCHAR(10),                -- GET, POST, PUT, DELETE
  
  -- Detalhes adicionais
  details JSONB,                             -- Dados extras (count, format, etc)
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Índices para buscas rápidas
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id)
);

-- Criar índices
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_resource ON audit_logs(resource);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_status ON audit_logs(status);

-- Row Level Security (RLS)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Política 1: Usuários veem seus próprios logs
CREATE POLICY "Usuários veem seus logs"
ON audit_logs FOR SELECT
USING (auth.uid() = user_id);

-- Política 2: Admin/Master veem tudo
CREATE POLICY "Admin veem todos logs"
ON audit_logs FOR SELECT
USING (
  (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('admin', 'master')
);

-- Política 3: Apenas sistema pode inserir (não usuários)
CREATE POLICY "Sistema insere logs"
ON audit_logs FOR INSERT
WITH CHECK (true);  -- Controle via código, não via RLS

-- Grants
GRANT SELECT ON audit_logs TO authenticated;
GRANT INSERT ON audit_logs TO authenticated;
```

### 3️⃣ Executar SQL

```
Clique em "Run" ou Ctrl+Enter
Esperado: ✅ Success
```

---

## 🔧 PASSO 2: Criar AuditService

### 1️⃣ Criar arquivo

```bash
Novo arquivo:
src/services/AuditService.ts
```

### 2️⃣ Copiar este código:

```typescript
// src/services/AuditService.ts

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL!,
  process.env.REACT_APP_SUPABASE_ANON_KEY!
);

export interface AuditLogEntry {
  // Usuário
  userId?: string;
  userEmail: string;
  userName?: string;
  userRole?: string;
  
  // Ação
  action: string;        // LEITURA_PROPOSTA, EXPORT_PROPOSALS, DELETE_USER, etc
  resource: string;      // proposal, user, report, settings
  resourceId?: string;   // ID do recurso específico
  
  // Resultado
  status: 'ALLOWED' | 'DENIED' | 'ERROR' | 'SUCCESS';
  errorMessage?: string;
  
  // Requisição
  ipAddress?: string;
  userAgent?: string;
  requestPath?: string;
  requestMethod?: string;
  
  // Detalhes extras
  details?: Record<string, any>;
}

/**
 * Registra um evento de auditoria
 */
export async function logAuditEvent(entry: AuditLogEntry) {
  try {
    console.log('📝 Registrando audit log:', entry.action);

    const { error } = await supabase
      .from('audit_logs')
      .insert({
        user_id: entry.userId,
        user_email: entry.userEmail,
        user_name: entry.userName,
        user_role: entry.userRole,
        action: entry.action,
        resource: entry.resource,
        resource_id: entry.resourceId,
        status: entry.status,
        error_message: entry.errorMessage,
        ip_address: entry.ipAddress,
        user_agent: entry.userAgent,
        request_path: entry.requestPath,
        request_method: entry.requestMethod,
        details: entry.details,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('❌ Erro ao registrar audit log:', error);
      // NÃO lançar erro - logging não deve quebrar a app
    } else {
      console.log(`✅ Log registrado: ${entry.action}`);
    }
  } catch (error) {
    console.error('❌ Exceção ao logar:', error);
  }
}

/**
 * Busca audit logs
 */
export async function getAuditLogs(options?: {
  action?: string;
  resource?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}) {
  try {
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (options?.action) {
      query = query.eq('action', options.action);
    }

    if (options?.resource) {
      query = query.eq('resource', options.resource);
    }

    if (options?.startDate) {
      query = query.gte('created_at', options.startDate.toISOString());
    }

    if (options?.endDate) {
      query = query.lte('created_at', options.endDate.toISOString());
    }

    const limit = options?.limit || 100;
    query = query.limit(limit);

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('❌ Erro ao buscar logs:', error);
    return [];
  }
}

/**
 * Deletar logs antigos (limpeza)
 * Manter apenas últimos 6 meses
 */
export async function cleanOldAuditLogs() {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { error } = await supabase
      .from('audit_logs')
      .delete()
      .lt('created_at', sixMonthsAgo.toISOString());

    if (error) throw error;

    console.log('✅ Logs antigos deletados');
  } catch (error) {
    console.error('❌ Erro ao limpar logs:', error);
  }
}

// ============================================
// EXEMPLOS DE USO
// ============================================

/*

// 1. Log de leitura bem-sucedida
await logAuditEvent({
  userId: user.id,
  userEmail: user.email,
  userName: user.user_metadata?.name,
  userRole: userRole,
  action: 'LEITURA_PROPOSTA',
  resource: 'proposal',
  resourceId: proposalId,
  status: 'SUCCESS',
  requestPath: '/api/proposals/123',
  requestMethod: 'GET',
  details: { timestamp: new Date() }
});

// 2. Log de acesso negado
await logAuditEvent({
  userId: user.id,
  userEmail: user.email,
  userRole: userRole,
  action: 'TENTATIVA_LEITURA_PROPOSTA',
  resource: 'proposal',
  resourceId: proposalId,
  status: 'DENIED',
  errorMessage: 'Usuário não tem permissão',
  details: { userRole, requiredRole: 'admin' }
});

// 3. Log de erro
await logAuditEvent({
  userId: user.id,
  userEmail: user.email,
  action: 'EXPORT_PROPOSTAS',
  resource: 'proposal',
  status: 'ERROR',
  errorMessage: 'Erro ao gerar PDF',
  details: { error: error.message }
});

// 4. Log de ação sensível (delete)
await logAuditEvent({
  userId: user.id,
  userEmail: user.email,
  userRole: userRole,
  action: 'DELETE_PROPOSTA',
  resource: 'proposal',
  resourceId: proposalId,
  status: 'SUCCESS',
  details: { proposalValue: 50000, client: 'João Silva' }
});

// 5. Log de export (ação importante)
await logAuditEvent({
  userId: user.id,
  userEmail: user.email,
  action: 'EXPORT_PROPOSALS',
  resource: 'proposal',
  status: 'SUCCESS',
  details: {
    format: 'csv',
    recordCount: 1500,
    timestamp: new Date()
  }
});

*/
```

---

## 🎣 PASSO 3: Integrar em Hooks Principais

### 1️⃣ Modificar useProposals.ts

Encontre o arquivo: `src/hooks/useProposals.ts` (ou similar)

```typescript
// src/hooks/useProposals.ts

import { logAuditEvent } from '@/services/AuditService';
import { useAuth } from './useAuth';
import { usePermissions } from './usePermissions';

export function useProposals() {
  const { user } = useAuth();
  const { userRole } = usePermissions();

  // ============================================
  // LEITURA DE PROPOSTAS
  // ============================================
  const fetchProposals = async () => {
    try {
      const response = await api.get('/proposals');

      // ✅ LOG: Leitura bem-sucedida
      await logAuditEvent({
        userId: user?.id,
        userEmail: user?.email || 'unknown',
        userName: user?.user_metadata?.name,
        userRole: userRole,
        action: 'LEITURA_LISTA_PROPOSTAS',
        resource: 'proposal',
        status: 'SUCCESS',
        requestPath: '/api/proposals',
        requestMethod: 'GET',
        details: {
          recordCount: response.data.length,
          timestamp: new Date()
        }
      });

      return response.data;
    } catch (error: any) {
      // ❌ LOG: Erro na leitura
      await logAuditEvent({
        userId: user?.id,
        userEmail: user?.email || 'unknown',
        userRole: userRole,
        action: 'LEITURA_LISTA_PROPOSTAS',
        resource: 'proposal',
        status: 'ERROR',
        errorMessage: error.message,
        requestPath: '/api/proposals',
        requestMethod: 'GET'
      });

      throw error;
    }
  };

  // ============================================
  // LEITURA DE UMA PROPOSTA
  // ============================================
  const getProposal = async (proposalId: string) => {
    try {
      const response = await api.get(`/proposals/${proposalId}`);

      // ✅ LOG: Proposta lida
      await logAuditEvent({
        userId: user?.id,
        userEmail: user?.email || 'unknown',
        userName: user?.user_metadata?.name,
        userRole: userRole,
        action: 'LEITURA_PROPOSTA',
        resource: 'proposal',
        resourceId: proposalId,
        status: 'SUCCESS',
        requestPath: `/api/proposals/${proposalId}`,
        requestMethod: 'GET'
      });

      return response.data;
    } catch (error: any) {
      // ❌ LOG: Erro ou acesso negado
      const status = error.response?.status === 403 ? 'DENIED' : 'ERROR';
      const message = 
        error.response?.status === 403 
          ? 'Sem permissão para acessar' 
          : error.message;

      await logAuditEvent({
        userId: user?.id,
        userEmail: user?.email || 'unknown',
        userRole: userRole,
        action: 'LEITURA_PROPOSTA',
        resource: 'proposal',
        resourceId: proposalId,
        status: status as any,
        errorMessage: message,
        requestPath: `/api/proposals/${proposalId}`,
        requestMethod: 'GET'
      });

      throw error;
    }
  };

  // ============================================
  // EXPORT DE PROPOSTAS (AÇÃO SENSÍVEL!)
  // ============================================
  const exportProposals = async (format: 'csv' | 'pdf' | 'xlsx', filters?: any) => {
    try {
      const response = await api.post('/proposals/export', {
        format,
        filters
      });

      // ✅ LOG: Export bem-sucedido (SEMPRE logar exports!)
      await logAuditEvent({
        userId: user?.id,
        userEmail: user?.email || 'unknown',
        userName: user?.user_metadata?.name,
        userRole: userRole,
        action: 'EXPORT_PROPOSTAS',
        resource: 'proposal',
        status: 'SUCCESS',
        requestPath: '/api/proposals/export',
        requestMethod: 'POST',
        details: {
          format,
          recordCount: response.data.recordCount || 0,
          timestamp: new Date(),
          filters: filters ? Object.keys(filters) : []
        }
      });

      return response.data;
    } catch (error: any) {
      // ❌ LOG: Erro no export
      await logAuditEvent({
        userId: user?.id,
        userEmail: user?.email || 'unknown',
        userRole: userRole,
        action: 'EXPORT_PROPOSTAS',
        resource: 'proposal',
        status: 'ERROR',
        errorMessage: error.message,
        requestPath: '/api/proposals/export',
        requestMethod: 'POST',
        details: { format }
      });

      throw error;
    }
  };

  // ============================================
  // DELETE DE PROPOSTA (AÇÃO CRÍTICA!)
  // ============================================
  const deleteProposal = async (proposalId: string) => {
    try {
      await api.delete(`/proposals/${proposalId}`);

      // ✅ LOG: Delete bem-sucedido (CRÍTICO!)
      await logAuditEvent({
        userId: user?.id,
        userEmail: user?.email || 'unknown',
        userName: user?.user_metadata?.name,
        userRole: userRole,
        action: 'DELETE_PROPOSTA',
        resource: 'proposal',
        resourceId: proposalId,
        status: 'SUCCESS',
        requestPath: `/api/proposals/${proposalId}`,
        requestMethod: 'DELETE',
        details: {
          timestamp: new Date(),
          note: 'Proposta foi deletada permanentemente'
        }
      });

      return true;
    } catch (error: any) {
      // ❌ LOG: Erro ou acesso negado
      const status = error.response?.status === 403 ? 'DENIED' : 'ERROR';

      await logAuditEvent({
        userId: user?.id,
        userEmail: user?.email || 'unknown',
        userRole: userRole,
        action: 'DELETE_PROPOSTA',
        resource: 'proposal',
        resourceId: proposalId,
        status: status as any,
        errorMessage: error.message,
        requestPath: `/api/proposals/${proposalId}`,
        requestMethod: 'DELETE'
      });

      throw error;
    }
  };

  return {
    fetchProposals,
    getProposal,
    exportProposals,
    deleteProposal
  };
}
```

### 2️⃣ Fazer o mesmo em outros hooks

Você tem mais desses? Por exemplo:
- `useUsers.ts` (criar/editar/deletar usuários)
- `useReports.ts` (gerar/exportar relatórios)
- `useSettings.ts` (mudanças de configuração)

**Padrão para copiar:**

```typescript
try {
  // ... sua lógica ...
  
  await logAuditEvent({
    userId: user?.id,
    userEmail: user?.email || 'unknown',
    userRole: userRole,
    action: 'ACAO_QUE_ACONTECEU',      // LEITURA_X, CREATE_Y, DELETE_Z
    resource: 'resource_type',         // proposal, user, report
    resourceId: id,
    status: 'SUCCESS',
    requestPath: '/api/endpoint',
    requestMethod: 'GET|POST|PUT|DELETE',
    details: { extra: 'data' }
  });
} catch (error) {
  await logAuditEvent({
    userId: user?.id,
    userEmail: user?.email || 'unknown',
    userRole: userRole,
    action: 'ACAO_QUE_ACONTECEU',
    resource: 'resource_type',
    resourceId: id,
    status: 'ERROR',
    errorMessage: error.message,
    requestPath: '/api/endpoint',
    requestMethod: 'GET|POST|PUT|DELETE'
  });
  throw error;
}
```

---

## 👁️ PASSO 4: Criar Interface para Ver Logs

### Criar nova página

```bash
Novo arquivo:
src/pages/AuditLogsPage.tsx
```

```typescript
// src/pages/AuditLogsPage.tsx

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { getAuditLogs } from '@/services/AuditService';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AuditLog {
  id: string;
  user_email: string;
  user_name: string;
  action: string;
  resource: string;
  resource_id: string;
  status: string;
  created_at: string;
  details: any;
  error_message: string;
}

export function AuditLogsPage() {
  const { user } = useAuth();
  const { isMaster } = usePermissions();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: '',
    resource: '',
    status: ''
  });

  // Apenas Master/Admin podem ver
  if (!isMaster) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500">❌ Sem permissão para acessar audit logs</p>
      </div>
    );
  }

  useEffect(() => {
    loadLogs();
  }, [filters]);

  async function loadLogs() {
    setLoading(true);
    const data = await getAuditLogs({
      action: filters.action || undefined,
      resource: filters.resource || undefined,
      limit: 200
    });
    setLogs(data as AuditLog[]);
    setLoading(false);
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">🔍 Audit Logs</h1>

      {/* Filtros */}
      <div className="bg-gray-100 p-4 rounded mb-6 grid grid-cols-3 gap-4">
        <input
          type="text"
          placeholder="Filtrar por ação..."
          value={filters.action}
          onChange={(e) => setFilters({ ...filters, action: e.target.value })}
          className="px-3 py-2 border rounded"
        />
        <input
          type="text"
          placeholder="Filtrar por recurso..."
          value={filters.resource}
          onChange={(e) => setFilters({ ...filters, resource: e.target.value })}
          className="px-3 py-2 border rounded"
        />
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="px-3 py-2 border rounded"
        >
          <option value="">Todos os status</option>
          <option value="SUCCESS">✅ Success</option>
          <option value="ERROR">❌ Error</option>
          <option value="DENIED">🚫 Denied</option>
        </select>
      </div>

      {/* Tabela */}
      {loading ? (
        <p>Carregando...</p>
      ) : (
        <table className="w-full border-collapse border border-gray-300">
          <thead className="bg-gray-200">
            <tr>
              <th className="border p-2 text-left">Data/Hora</th>
              <th className="border p-2 text-left">Usuário</th>
              <th className="border p-2 text-left">Ação</th>
              <th className="border p-2 text-left">Recurso</th>
              <th className="border p-2 text-left">Status</th>
              <th className="border p-2 text-left">Detalhes</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="border p-2 text-sm">
                  {formatDistanceToNow(new Date(log.created_at), {
                    addSuffix: true,
                    locale: ptBR
                  })}
                </td>
                <td className="border p-2 text-sm">{log.user_email}</td>
                <td className="border p-2 text-sm font-mono">{log.action}</td>
                <td className="border p-2 text-sm">{log.resource}</td>
                <td className="border p-2 text-sm">
                  {log.status === 'SUCCESS' && '✅'}
                  {log.status === 'ERROR' && '❌'}
                  {log.status === 'DENIED' && '🚫'}
                  {log.status === 'ALLOWED' && '✔️'}
                  {' '}{log.status}
                </td>
                <td className="border p-2 text-xs">
                  {log.error_message && (
                    <span className="text-red-600">{log.error_message}</span>
                  )}
                  {log.resource_id && (
                    <span className="text-gray-600">
                      ID: {log.resource_id}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="mt-6 text-gray-600">
        Total: {logs.length} registros
      </div>
    </div>
  );
}
```

### Adicionar ao menu

Se você tem um arquivo de rotas/navegação, adicione:

```typescript
{
  path: '/admin/audit-logs',
  element: <AuditLogsPage />,
  requiredRole: 'master'
}
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

```
- [ ] Executar SQL no Supabase (criar tabela)
- [ ] Criar src/services/AuditService.ts
- [ ] Testar AuditService (console.log funciona?)
- [ ] Integrar em useProposals.ts
- [ ] Testar logging (fazer uma leitura de proposta)
- [ ] Verificar se apareceu em audit_logs no Supabase
- [ ] Integrar em outros hooks (useUsers, useReports, etc)
- [ ] Criar AuditLogsPage.tsx
- [ ] Adicionar rota /admin/audit-logs
- [ ] Testar interface de logs
- [ ] Deploy em staging
- [ ] Validar logs aparecem corretamente
```

---

## 🧪 PASSO 5: Testar

### 1️⃣ Testar no navegador

```
1. Abra a plataforma
2. Faça uma leitura de proposta
3. Abra DevTools (F12)
4. Vá em Console
5. Procure por "✅ Log registrado"
```

### 2️⃣ Testar no Supabase

```
1. Abra https://app.supabase.com
2. Projeto Delta Navigator
3. SQL Editor
4. Execute:

SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10;

Esperado: Ver logs que você acabou de criar
```

### 3️⃣ Testar interface de logs

```
1. Na plataforma, acesse /admin/audit-logs
2. Veja os logs em tempo real
3. Teste filtros
```

---

## 🎯 Ações que Devem ser Sempre Registradas

Certifique-se de logar essas ações CRÍTICAS:

```
✅ LEITURA_PROPOSTA         - Quando alguém vê uma proposta
✅ EXPORT_PROPOSTAS         - Quando exporta dados
✅ DELETE_PROPOSTA          - Quando deleta proposta
✅ CREATE_USUARIO           - Novo usuário criado
✅ DELETE_USUARIO           - Usuário deletado
✅ UPDATE_PERMISSOES        - Permissões mudadas
✅ ACESSO_NEGADO            - Tentativa de acesso sem permissão
✅ ERRO_CRITICO             - Qualquer erro no sistema
✅ EXPORT_RELATORIO         - Quando exporta relatório
✅ MUDANCA_CONFIGURACAO     - Quando muda settings
```

---

## 📊 Exemplo de Saída no Banco

```
id                                   | user_email              | action                | resource  | status  | created_at
─────────────────────────────────────┼────────────────────────┼──────────────────────┼──────────┼─────────┼──────────────────────
550e8400-e29b-41d4-a716-446655440000 | joao@empresa.com        | LEITURA_PROPOSTA      | proposal  | SUCCESS | 2025-11-25 10:30:15
550e8400-e29b-41d4-a716-446655440001 | maria@empresa.com       | EXPORT_PROPOSTAS      | proposal  | SUCCESS | 2025-11-25 10:31:22
550e8400-e29b-41d4-a716-446655440002 | pedro@empresa.com       | DELETE_PROPOSTA       | proposal  | DENIED  | 2025-11-25 10:32:45
550e8400-e29b-41d4-a716-446655440003 | admin@empresa.com       | CREATE_USUARIO        | user      | SUCCESS | 2025-11-25 10:33:10
550e8400-e29b-41d4-a716-446655440004 | ana@empresa.com         | ACESSO_NEGADO         | proposal  | DENIED  | 2025-11-25 10:34:02
```

---

## 💡 Dicas Finais

1. **Não logar em TUDO** - Só ações importantes
2. **Incluir contexto** - Details com dados úteis
3. **Nunca logar senhas** - NUNCA em plaintext
4. **Logging não pode quebrar** - Use try/catch sem throw
5. **Limpar periodicamente** - Deletar logs > 6 meses

---

Pronto? Quer que eu:
- [ ] Ajude com alguma integração específica?
- [ ] Mostre como fazer em outro hook?
- [ ] Crie a página de logs?
- [ ] Teste tudo junto?

Avisa! 🚀
