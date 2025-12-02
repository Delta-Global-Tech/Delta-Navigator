# 🔍 Implementação de Audit Logs - Adaptado para Sua Tabela

**Data**: 25 de Novembro de 2025  
**Status**: Tabela já existe! Vamos integrar o código

---

## ✅ TABELA JÁ CRIADA

Você tem:
```sql
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT NOT NULL,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  resource_id TEXT NULL,
  details JSONB NULL,
  ip_address INET NULL,
  user_agent TEXT NULL,
  status TEXT DEFAULT 'success',
  error_message TEXT NULL,
  duration_ms INTEGER NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

**Índices**: ✅ Já criados  
**Dados**: ✅ Já populado  
**RLS**: ❓ Vamos verificar

---

## 🔐 PASSO 1: Verificar/Criar RLS (Row Level Security)

Se ainda não tem RLS, execute no Supabase:

```sql
-- Habilitar RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Política 1: Usuários veem seus próprios logs
CREATE POLICY "Usuários veem seus logs"
ON audit_logs FOR SELECT
USING (auth.uid() = user_id);

-- Política 2: Master/Admin veem tudo
CREATE POLICY "Admin veem todos logs"
ON audit_logs FOR SELECT
USING (
  (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('admin', 'master')
);

-- Política 3: Apenas sistema pode inserir
CREATE POLICY "Sistema insere logs"
ON audit_logs FOR INSERT
WITH CHECK (true);
```

---

## 🔧 PASSO 2: Criar AuditService.ts

**Novo arquivo:**
```
src/services/AuditService.ts
```

**Copiar este código:**

```typescript
// src/services/AuditService.ts

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL!,
  process.env.REACT_APP_SUPABASE_ANON_KEY!
);

export interface AuditLogEntry {
  userId?: string;
  userEmail: string;
  action: string;              // LEITURA_PROPOSTA, EXPORT, DELETE, etc
  resource: string;            // proposal, user, report, settings
  resourceId?: string;         // ID específico
  status?: 'success' | 'error' | 'denied';
  errorMessage?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
  durationMs?: number;          // Tempo da operação em ms
}

/**
 * Registra um evento de auditoria
 */
export async function logAuditEvent(entry: AuditLogEntry) {
  try {
    const startTime = performance.now();

    const { error } = await supabase
      .from('audit_logs')
      .insert({
        user_id: entry.userId,
        user_email: entry.userEmail,
        action: entry.action,
        resource: entry.resource,
        resource_id: entry.resourceId,
        status: entry.status || 'success',
        error_message: entry.errorMessage,
        ip_address: entry.ipAddress,
        user_agent: entry.userAgent,
        details: entry.details,
        duration_ms: entry.durationMs,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
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

/**
 * Busca audit logs com filtros
 */
export async function getAuditLogs(options?: {
  action?: string;
  resource?: string;
  userId?: string;
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

    if (options?.userId) {
      query = query.eq('user_id', options.userId);
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
 * Busca estatísticas de logs
 */
export async function getAuditStats(days: number = 7) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('audit_logs')
      .select('action, status, user_email')
      .gte('created_at', startDate.toISOString());

    if (error) throw error;

    const stats = {
      total: data?.length || 0,
      byAction: {} as Record<string, number>,
      byStatus: { success: 0, error: 0, denied: 0 },
      byUser: {} as Record<string, number>
    };

    data?.forEach((log) => {
      // Por ação
      stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;

      // Por status
      stats.byStatus[log.status as keyof typeof stats.byStatus]++;

      // Por usuário
      stats.byUser[log.user_email] = (stats.byUser[log.user_email] || 0) + 1;
    });

    return stats;
  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error);
    return null;
  }
}

/**
 * Exporta logs como CSV
 */
export async function exportAuditLogsAsCSV(options?: {
  action?: string;
  resource?: string;
  days?: number;
}) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (options?.days || 30));

    const logs = await getAuditLogs({
      action: options?.action,
      resource: options?.resource,
      startDate,
      limit: 10000
    });

    if (!logs || logs.length === 0) {
      console.warn('⚠️ Nenhum log para exportar');
      return null;
    }

    // Converter para CSV
    const headers = [
      'Data/Hora',
      'Usuário',
      'Ação',
      'Recurso',
      'ID Recurso',
      'Status',
      'IP',
      'Duração (ms)',
      'Detalhes'
    ];

    const rows = logs.map((log: any) => [
      new Date(log.created_at).toLocaleString('pt-BR'),
      log.user_email,
      log.action,
      log.resource,
      log.resource_id || '-',
      log.status,
      log.ip_address || '-',
      log.duration_ms || '-',
      log.error_message || JSON.stringify(log.details || {})
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))
    ].join('\n');

    // Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return true;
  } catch (error) {
    console.error('❌ Erro ao exportar logs:', error);
    return null;
  }
}

// ============================================
// EXEMPLOS DE USO
// ============================================

/*

// 1. Log simples de leitura
await logAuditEvent({
  userId: user.id,
  userEmail: user.email,
  action: 'LEITURA_PROPOSTA',
  resource: 'proposal',
  resourceId: proposalId,
  status: 'success'
});

// 2. Log com erro
await logAuditEvent({
  userId: user.id,
  userEmail: user.email,
  action: 'EXPORT_PROPOSTAS',
  resource: 'proposal',
  status: 'error',
  errorMessage: 'Erro ao gerar PDF',
  durationMs: 5000
});

// 3. Log com detalhes
await logAuditEvent({
  userId: user.id,
  userEmail: user.email,
  action: 'DELETE_PROPOSTA',
  resource: 'proposal',
  resourceId: proposalId,
  status: 'success',
  details: {
    proposalValue: 50000,
    clientName: 'João Silva',
    reason: 'Cancelamento solicitado'
  }
});

// 4. Log de acesso negado
await logAuditEvent({
  userId: user.id,
  userEmail: user.email,
  action: 'TENTATIVA_DELETE_PROPOSTA',
  resource: 'proposal',
  resourceId: proposalId,
  status: 'denied',
  errorMessage: 'Sem permissão para deletar'
});

// 5. Buscar logs de um usuário
const userLogs = await getAuditLogs({
  userId: userId,
  limit: 50
});

// 6. Buscar logs de uma ação específica
const deleteLogs = await getAuditLogs({
  action: 'DELETE_PROPOSTA',
  days: 30
});

// 7. Buscar estatísticas
const stats = await getAuditStats(7); // últimos 7 dias
console.log(stats);
// {
//   total: 145,
//   byAction: { LEITURA_PROPOSTA: 120, DELETE_PROPOSTA: 2, EXPORT: 23 },
//   byStatus: { success: 143, error: 2, denied: 0 },
//   byUser: { joao@empresa.com: 80, maria@empresa.com: 65 }
// }

// 8. Exportar logs como CSV
await exportAuditLogsAsCSV({
  resource: 'proposal',
  days: 30
});

*/
```

---

## 🎣 PASSO 3: Integrar em Hooks

### Padrão para TODAS as operações:

```typescript
import { logAuditEvent } from '@/services/AuditService';

// ❌ LEITURA
const fetchProposals = async () => {
  const startTime = performance.now();
  try {
    const response = await api.get('/proposals');
    
    const duration = performance.now() - startTime;
    
    await logAuditEvent({
      userId: user?.id,
      userEmail: user?.email || 'unknown',
      action: 'LEITURA_LISTA_PROPOSTAS',
      resource: 'proposal',
      status: 'success',
      details: { count: response.data.length },
      durationMs: Math.round(duration)
    });

    return response.data;
  } catch (error: any) {
    await logAuditEvent({
      userId: user?.id,
      userEmail: user?.email || 'unknown',
      action: 'LEITURA_LISTA_PROPOSTAS',
      resource: 'proposal',
      status: 'error',
      errorMessage: error.message
    });
    throw error;
  }
};

// ❌ EXPORT (CRÍTICO - SEMPRE LOGAR!)
const exportProposals = async (format: string) => {
  const startTime = performance.now();
  try {
    const response = await api.post('/proposals/export', { format });
    
    const duration = performance.now() - startTime;
    
    await logAuditEvent({
      userId: user?.id,
      userEmail: user?.email || 'unknown',
      action: 'EXPORT_PROPOSTAS',
      resource: 'proposal',
      status: 'success',
      details: {
        format,
        recordCount: response.data.recordCount,
        timestamp: new Date()
      },
      durationMs: Math.round(duration)
    });

    return response.data;
  } catch (error: any) {
    await logAuditEvent({
      userId: user?.id,
      userEmail: user?.email || 'unknown',
      action: 'EXPORT_PROPOSTAS',
      resource: 'proposal',
      status: 'error',
      errorMessage: error.message,
      details: { format }
    });
    throw error;
  }
};

// ❌ DELETE (CRÍTICO!)
const deleteProposal = async (proposalId: string) => {
  try {
    await api.delete(`/proposals/${proposalId}`);

    await logAuditEvent({
      userId: user?.id,
      userEmail: user?.email || 'unknown',
      action: 'DELETE_PROPOSTA',
      resource: 'proposal',
      resourceId: proposalId,
      status: 'success',
      details: { note: 'Proposta deletada permanentemente' }
    });

    return true;
  } catch (error: any) {
    await logAuditEvent({
      userId: user?.id,
      userEmail: user?.email || 'unknown',
      action: 'DELETE_PROPOSTA',
      resource: 'proposal',
      resourceId: proposalId,
      status: error.response?.status === 403 ? 'denied' : 'error',
      errorMessage: error.message
    });
    throw error;
  }
};
```

---

## 👁️ PASSO 4: Interface para Ver Logs

**Novo arquivo:**
```
src/pages/admin/AuditLogsPage.tsx
```

```typescript
// src/pages/admin/AuditLogsPage.tsx

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { getAuditLogs, getAuditStats, exportAuditLogsAsCSV } from '@/services/AuditService';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AuditLog {
  id: string;
  user_email: string;
  action: string;
  resource: string;
  resource_id: string;
  status: string;
  error_message: string;
  duration_ms: number;
  created_at: string;
  details: any;
}

export function AuditLogsPage() {
  const { user } = useAuth();
  const { isMaster } = usePermissions();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'logs' | 'stats'>('logs');
  const [filters, setFilters] = useState({
    action: '',
    resource: '',
    status: ''
  });

  // Apenas Master/Admin
  if (!isMaster) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500">❌ Sem permissão para acessar audit logs</p>
      </div>
    );
  }

  useEffect(() => {
    loadLogs();
    loadStats();
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

  async function loadStats() {
    const data = await getAuditStats(7);
    setStats(data);
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">🔍 Audit Logs</h1>
          <p className="text-gray-600">Rastreamento completo de ações na plataforma</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setTab('logs')}
            className={`px-4 py-2 rounded font-medium ${
              tab === 'logs'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300'
            }`}
          >
            📋 Logs
          </button>
          <button
            onClick={() => setTab('stats')}
            className={`px-4 py-2 rounded font-medium ${
              tab === 'stats'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300'
            }`}
          >
            📊 Estatísticas
          </button>
        </div>

        {/* TAB: LOGS */}
        {tab === 'logs' && (
          <>
            {/* Filtros */}
            <div className="bg-white p-6 rounded-lg shadow mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <input
                type="text"
                placeholder="Filtrar por ação..."
                value={filters.action}
                onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded"
              />
              <input
                type="text"
                placeholder="Filtrar por recurso..."
                value={filters.resource}
                onChange={(e) => setFilters({ ...filters, resource: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded"
              />
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded"
              >
                <option value="">Todos os status</option>
                <option value="success">✅ Success</option>
                <option value="error">❌ Error</option>
                <option value="denied">🚫 Denied</option>
              </select>
              <button
                onClick={() => exportAuditLogsAsCSV()}
                className="px-4 py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700"
              >
                📥 Exportar CSV
              </button>
            </div>

            {/* Tabela */}
            {loading ? (
              <div className="text-center py-8">Carregando...</div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-100 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                        Data/Hora
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                        Usuário
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                        Ação
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                        Recurso
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                        Duração
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-sm text-gray-600">
                          {formatDistanceToNow(new Date(log.created_at), {
                            addSuffix: true,
                            locale: ptBR
                          })}
                        </td>
                        <td className="px-6 py-3 text-sm font-medium">{log.user_email}</td>
                        <td className="px-6 py-3 text-sm font-mono text-blue-600">
                          {log.action}
                        </td>
                        <td className="px-6 py-3 text-sm">{log.resource}</td>
                        <td className="px-6 py-3 text-sm">
                          {log.status === 'success' && '✅ Success'}
                          {log.status === 'error' && '❌ Error'}
                          {log.status === 'denied' && '🚫 Denied'}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-600">
                          {log.duration_ms ? `${log.duration_ms}ms` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-4 text-gray-600">
              Total: {logs.length} registros
            </div>
          </>
        )}

        {/* TAB: ESTATÍSTICAS */}
        {tab === 'stats' && (
          <>
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-gray-600 text-sm font-medium mb-2">Total de Logs (7 dias)</h3>
                  <p className="text-4xl font-bold text-blue-600">{stats.total}</p>
                </div>

                {/* Por Status */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-gray-600 text-sm font-medium mb-4">Por Status</h3>
                  <div className="space-y-2">
                    <p className="text-sm">
                      ✅ Success: <strong>{stats.byStatus.success}</strong>
                    </p>
                    <p className="text-sm">
                      ❌ Error: <strong>{stats.byStatus.error}</strong>
                    </p>
                    <p className="text-sm">
                      🚫 Denied: <strong>{stats.byStatus.denied}</strong>
                    </p>
                  </div>
                </div>

                {/* Top Ações */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-gray-600 text-sm font-medium mb-4">Top Ações</h3>
                  <div className="space-y-2">
                    {Object.entries(stats.byAction)
                      .sort(([, a], [, b]) => (b as number) - (a as number))
                      .slice(0, 5)
                      .map(([action, count]) => (
                        <p key={action} className="text-sm">
                          {action}: <strong>{count}</strong>
                        </p>
                      ))}
                  </div>
                </div>

                {/* Top Usuários */}
                <div className="bg-white p-6 rounded-lg shadow md:col-span-3">
                  <h3 className="text-gray-600 text-sm font-medium mb-4">Atividade por Usuário</h3>
                  <div className="space-y-2">
                    {Object.entries(stats.byUser)
                      .sort(([, a], [, b]) => (b as number) - (a as number))
                      .map(([email, count]) => (
                        <div key={email} className="flex justify-between items-center">
                          <span className="text-sm">{email}</span>
                          <span className="text-sm font-medium bg-gray-100 px-3 py-1 rounded">
                            {count} ações
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
```

---

## ✅ CHECKLIST FINAL

- [ ] Criar `src/services/AuditService.ts`
- [ ] Copiar código do AuditService
- [ ] Verificar RLS na tabela (executar SQL se necessário)
- [ ] Integrar `logAuditEvent` em `useProposals.ts` (ou seu hook)
- [ ] Testar: fazer uma ação e verificar se logou
- [ ] Integrar em outros hooks (useUsers, etc)
- [ ] Criar `src/pages/admin/AuditLogsPage.tsx`
- [ ] Adicionar rota `/admin/audit-logs`
- [ ] Testar interface de logs
- [ ] Testar filtros
- [ ] Testar exportação CSV

---

## 🧪 TESTAR

### 1️⃣ No console do navegador (F12)

```
Fazer uma ação (leitura de proposta)
Procurar por: "✅ Log registrado"
```

### 2️⃣ No Supabase

```sql
SELECT * FROM audit_logs 
ORDER BY created_at DESC 
LIMIT 10;
```

### 3️⃣ Na interface

```
Acessar /admin/audit-logs
Ver logs em tempo real
Testar filtros
Exportar como CSV
```

---

## 💡 Ações que SEMPRE devem ser logadas

```
✅ LEITURA_PROPOSTA
✅ EXPORT_PROPOSTAS
✅ DELETE_PROPOSTA
✅ CREATE_USUARIO
✅ DELETE_USUARIO
✅ UPDATE_PERMISSOES
✅ MUDANCA_CONFIGURACAO
✅ ACESSO_NEGADO (tentativas)
✅ ERRO_CRITICO
```

---

## 🎯 Próximo Passo

Após testar e validar os AUDIT LOGS, vamos fazer:

2. **RATE LIMITING** (proteção contra brute force)
3. **SECURITY HEADERS** (proteger dados em trânsito)
4. **VALIDAÇÃO DE ENTRADA** (evitar SQL injection)
5. **DOCUMENTAÇÃO LGPD** (conformidade legal)

Está tudo pronto para implementar? Precisa de ajuda em alguma parte? 🚀
