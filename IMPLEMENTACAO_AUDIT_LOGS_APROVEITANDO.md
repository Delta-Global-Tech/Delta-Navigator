# 🔍 Audit Logs - Análise e Expansão do Que Você Tem

**Data**: 25 de Novembro de 2025  
**Status**: Você JÁ tem 102 logs registrados! Vamos expandir.

---

## ✅ O QUE VOCÊ JÁ TEM

Analisando seus dados:

```
✅ Tabela: audit_logs (102 registros)
✅ Registrando: VIEW, LOGOUT, LOGIN
✅ Usuários: michael.gomes, elias.ferreira, bruno.lopes
✅ Recursos: Dashboard, Auth, Contratos
✅ Campos: Tudo que precisamos!
```

**Ações já sendo logadas:**
- 🔐 LOGIN - Quando alguém entra
- 🚪 LOGOUT - Quando alguém sai
- 👁️ VIEW - Quando acessa uma página/dashboard

---

## 🎯 O QUE ESTÁ FALTANDO LOGAR

Você está rastreando **autenticação e visualizações**, mas faltam:

```
❌ EXPORT (exportação de dados - CRÍTICO!)
❌ CREATE (criação de registros)
❌ UPDATE (edição de registros)
❌ DELETE (deleção de registros - CRÍTICO!)
❌ ACESSO_NEGADO (tentativas bloqueadas)
❌ ERRO (quando algo dá errado)
❌ MUDANCA_CONFIGURACAO (settings)
```

---

## 🔧 PASSO 1: AuditService.ts (Reutilizando Sua Estrutura)

**Novo arquivo:**
```
src/services/AuditService.ts
```

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
  action: string;              // LOGIN, LOGOUT, VIEW, EXPORT, DELETE, etc
  resource: string;            // Auth, Dashboard, Contratos, Proposals, etc
  resourceId?: string;
  status?: 'success' | 'error' | 'denied';
  errorMessage?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
  durationMs?: number;
}

/**
 * Registra um evento de auditoria
 * Reutiliza a estrutura que você já tem
 */
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
 * Busca audit logs
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
    const { data, error } = await query.limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('❌ Erro ao buscar logs:', error);
    return [];
  }
}

/**
 * Busca estatísticas
 */
export async function getAuditStats(days: number = 7) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('audit_logs')
      .select('action, status, user_email, resource')
      .gte('created_at', startDate.toISOString());

    if (error) throw error;

    const stats = {
      total: data?.length || 0,
      byAction: {} as Record<string, number>,
      byStatus: { success: 0, error: 0, denied: 0 },
      byUser: {} as Record<string, number>,
      byResource: {} as Record<string, number>
    };

    data?.forEach((log) => {
      stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;
      stats.byStatus[log.status as keyof typeof stats.byStatus]++;
      stats.byUser[log.user_email] = (stats.byUser[log.user_email] || 0) + 1;
      stats.byResource[log.resource] = (stats.byResource[log.resource] || 0) + 1;
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

    const headers = [
      'Data/Hora',
      'Usuário',
      'Ação',
      'Recurso',
      'ID Recurso',
      'Status',
      'IP',
      'Duração (ms)',
      'Erro'
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
      log.error_message || '-'
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))
    ].join('\n');

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
```

---

## 🎣 PASSO 2: Integrar em Seus Hooks

### Localize seus hooks e adicione logging

**Exemplo - useContratos.ts (ou seu equivalente):**

```typescript
// src/hooks/useContratos.ts

import { logAuditEvent } from '@/services/AuditService';
import { useAuth } from './useAuth';

export function useContratos() {
  const { user } = useAuth();

  // ============================================
  // CRIAR CONTRATO (IMPORTANTE!)
  // ============================================
  const createContrato = async (data: any) => {
    const startTime = performance.now();
    try {
      const response = await api.post('/contratos', data);

      const duration = performance.now() - startTime;

      await logAuditEvent({
        userId: user?.id,
        userEmail: user?.email || 'unknown',
        action: 'CREATE_CONTRATO',
        resource: 'Contratos',
        resourceId: response.data.id,
        status: 'success',
        details: {
          clienteName: data.cliente_nome,
          valor: data.valor,
          timestamp: new Date()
        },
        durationMs: Math.round(duration)
      });

      return response.data;
    } catch (error: any) {
      await logAuditEvent({
        userId: user?.id,
        userEmail: user?.email || 'unknown',
        action: 'CREATE_CONTRATO',
        resource: 'Contratos',
        status: 'error',
        errorMessage: error.message,
        details: { clienteName: data.cliente_nome }
      });
      throw error;
    }
  };

  // ============================================
  // EDITAR CONTRATO
  // ============================================
  const updateContrato = async (id: string, data: any) => {
    try {
      const response = await api.put(`/contratos/${id}`, data);

      await logAuditEvent({
        userId: user?.id,
        userEmail: user?.email || 'unknown',
        action: 'UPDATE_CONTRATO',
        resource: 'Contratos',
        resourceId: id,
        status: 'success',
        details: { changedFields: Object.keys(data) }
      });

      return response.data;
    } catch (error: any) {
      await logAuditEvent({
        userId: user?.id,
        userEmail: user?.email || 'unknown',
        action: 'UPDATE_CONTRATO',
        resource: 'Contratos',
        resourceId: id,
        status: 'error',
        errorMessage: error.message
      });
      throw error;
    }
  };

  // ============================================
  // DELETAR CONTRATO (CRÍTICO!)
  // ============================================
  const deleteContrato = async (id: string) => {
    try {
      await api.delete(`/contratos/${id}`);

      await logAuditEvent({
        userId: user?.id,
        userEmail: user?.email || 'unknown',
        action: 'DELETE_CONTRATO',
        resource: 'Contratos',
        resourceId: id,
        status: 'success',
        details: { note: 'Contrato deletado permanentemente' }
      });

      return true;
    } catch (error: any) {
      await logAuditEvent({
        userId: user?.id,
        userEmail: user?.email || 'unknown',
        action: 'DELETE_CONTRATO',
        resource: 'Contratos',
        resourceId: id,
        status: error.response?.status === 403 ? 'denied' : 'error',
        errorMessage: error.message
      });
      throw error;
    }
  };

  // ============================================
  // EXPORTAR CONTRATOS (CRÍTICO!)
  // ============================================
  const exportContratos = async (format: 'csv' | 'pdf' | 'xlsx') => {
    const startTime = performance.now();
    try {
      const response = await api.post('/contratos/export', { format });

      const duration = performance.now() - startTime;

      await logAuditEvent({
        userId: user?.id,
        userEmail: user?.email || 'unknown',
        action: 'EXPORT_CONTRATOS',
        resource: 'Contratos',
        status: 'success',
        details: {
          format,
          recordCount: response.data.recordCount || 0,
          timestamp: new Date()
        },
        durationMs: Math.round(duration)
      });

      return response.data;
    } catch (error: any) {
      await logAuditEvent({
        userId: user?.id,
        userEmail: user?.email || 'unknown',
        action: 'EXPORT_CONTRATOS',
        resource: 'Contratos',
        status: 'error',
        errorMessage: error.message,
        details: { format }
      });
      throw error;
    }
  };

  return {
    createContrato,
    updateContrato,
    deleteContrato,
    exportContratos
  };
}
```

---

## 📊 PASSO 3: Dashboard de Logs (Interface)

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'denied':
        return '🚫';
      default:
        return '⚪';
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes('DELETE') || action.includes('EXPORT')) return 'text-red-600';
    if (action.includes('CREATE') || action.includes('UPDATE')) return 'text-blue-600';
    if (action.includes('VIEW') || action.includes('LOGIN')) return 'text-green-600';
    return 'text-gray-600';
  };

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
            📋 Logs ({logs.length})
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
              <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left font-medium text-gray-700">
                        Data/Hora
                      </th>
                      <th className="px-6 py-3 text-left font-medium text-gray-700">
                        Usuário
                      </th>
                      <th className="px-6 py-3 text-left font-medium text-gray-700">
                        Ação
                      </th>
                      <th className="px-6 py-3 text-left font-medium text-gray-700">
                        Recurso
                      </th>
                      <th className="px-6 py-3 text-left font-medium text-gray-700">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left font-medium text-gray-700">
                        Duração
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-gray-600">
                          {formatDistanceToNow(new Date(log.created_at), {
                            addSuffix: true,
                            locale: ptBR
                          })}
                        </td>
                        <td className="px-6 py-3 font-medium">{log.user_email}</td>
                        <td className={`px-6 py-3 font-mono ${getActionColor(log.action)}`}>
                          {log.action}
                        </td>
                        <td className="px-6 py-3">{log.resource}</td>
                        <td className="px-6 py-3">
                          {getStatusIcon(log.status)} {log.status}
                        </td>
                        <td className="px-6 py-3 text-gray-600">
                          {log.duration_ms ? `${log.duration_ms}ms` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* TAB: ESTATÍSTICAS */}
        {tab === 'stats' && (
          <>
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-gray-600 text-sm font-medium mb-2">
                    Total (7 dias)
                  </h3>
                  <p className="text-4xl font-bold text-blue-600">{stats.total}</p>
                </div>

                {/* Por Status */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-gray-600 text-sm font-medium mb-4">Por Status</h3>
                  <div className="space-y-2 text-sm">
                    <p>✅ Success: <strong>{stats.byStatus.success}</strong></p>
                    <p>❌ Error: <strong>{stats.byStatus.error}</strong></p>
                    <p>🚫 Denied: <strong>{stats.byStatus.denied}</strong></p>
                  </div>
                </div>

                {/* Top Ações */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-gray-600 text-sm font-medium mb-4">Top Ações</h3>
                  <div className="space-y-1 text-sm">
                    {Object.entries(stats.byAction)
                      .sort(([, a], [, b]) => (b as number) - (a as number))
                      .slice(0, 5)
                      .map(([action, count]) => (
                        <p key={action}>
                          {action}: <strong>{count}</strong>
                        </p>
                      ))}
                  </div>
                </div>

                {/* Recursos */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-gray-600 text-sm font-medium mb-4">Recursos</h3>
                  <div className="space-y-1 text-sm">
                    {Object.entries(stats.byResource)
                      .sort(([, a], [, b]) => (b as number) - (a as number))
                      .map(([resource, count]) => (
                        <p key={resource}>
                          {resource}: <strong>{count}</strong>
                        </p>
                      ))}
                  </div>
                </div>

                {/* Top Usuários */}
                <div className="bg-white p-6 rounded-lg shadow md:col-span-2 lg:col-span-4">
                  <h3 className="text-gray-600 text-sm font-medium mb-4">Atividade por Usuário</h3>
                  <div className="space-y-2">
                    {Object.entries(stats.byUser)
                      .sort(([, a], [, b]) => (b as number) - (a as number))
                      .map(([email, count]) => (
                        <div key={email} className="flex justify-between items-center text-sm">
                          <span>{email}</span>
                          <span className="bg-gray-100 px-3 py-1 rounded font-medium">
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

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

- [ ] Criar `src/services/AuditService.ts`
- [ ] Integrar em `useContratos.ts` (CREATE, UPDATE, DELETE, EXPORT)
- [ ] Integrar em `usePropostas.ts` (se tiver)
- [ ] Integrar em `useUsuarios.ts` (se tiver)
- [ ] Testar: fazer uma ação e verificar log
- [ ] Criar `src/pages/admin/AuditLogsPage.tsx`
- [ ] Adicionar rota `/admin/audit-logs`
- [ ] Testar interface
- [ ] Validar que está logando corretamente

---

## 🎯 AÇÕES QUE DEVEM SER LOGADAS (RESUMO)

```
LOGIN           ✅ Já tem
LOGOUT          ✅ Já tem
VIEW            ✅ Já tem
──────────────────────
CREATE_*        ❌ Adicionar
UPDATE_*        ❌ Adicionar
DELETE_*        ❌ Adicionar (CRÍTICO!)
EXPORT_*        ❌ Adicionar (CRÍTICO!)
ACESSO_NEGADO   ❌ Adicionar
ERRO            ❌ Adicionar
```

---

## 💡 Próximos Passos

Após implementar audit logs:

2. **RATE LIMITING** (proteção contra brute force)
3. **SECURITY HEADERS** (proteger dados em trânsito)
4. **VALIDAÇÃO DE ENTRADA** (evitar SQL injection)
5. **DOCUMENTAÇÃO LGPD** (conformidade legal)

Quer começar? Qual arquivo você quer que eu crie PRIMEIRO:

- [ ] `AuditService.ts`?
- [ ] Exemplos de integração nos seus hooks?
- [ ] `AuditLogsPage.tsx` (dashboard)?
- [ ] Tudo junto?

Avisa! 🚀
