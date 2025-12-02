# 📊 Auditoria Simplificada - READ-ONLY

**Status**: Você já tem o essencial! Vamos só melhorar.

---

## ✅ O QUE VOCÊ JÁ REGISTRA

```
✅ LOGIN        - Quando entra
✅ LOGOUT       - Quando sai  
✅ VIEW         - Qual tela acessou
✅ timestamp    - Que hora foi
✅ user_email   - Quem fez
✅ duration_ms  - Quanto tempo ficou
```

**Exemplo de log que você já tem:**

```
id:            ba6481b1-dc97-4c41-a136-0ec2444a3cf15
user_email:    michael.gomes@deltaglobalbank.com.br
action:        VIEW
resource:      Dashboard
user_id:       c59a2ed8-f817-4258-99e3-a576a...
created_at:    2025-11-25 14:32:15
status:        success
```

---

## 🎯 O QUE FALTA (MUITO POUCO!)

Para **COMPLIANCE BACEN/LGPD**, você só precisa adicionar:

| Campo | O que é | Exemplo |
|-------|---------|---------|
| **ip_address** | IP de quem acessou | `192.168.1.50` |
| **user_agent** | Navegador/dispositivo | `Chrome on Windows 10` |
| **details** | Dados extras (opcional) | `{ "dashboard": "Dashboard", "filters": { "status": "ativo" } }` |

É isso! Nada de CREATE/UPDATE/DELETE porque você não cria/edita/deleta nada.

---

## 🔧 IMPLEMENTAÇÃO SUPER SIMPLES

### 1️⃣ Capturar IP e User-Agent

**Você provavelmente já tem um middleware no seu servidor que faz isso:**

```typescript
// server/middleware/auditLog.ts (SE NÃO TIVER, CRIE)

import { Request, Response, NextFunction } from 'express';
import { logAuditEvent } from '@/services/AuditService';

export async function auditLogMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Captura início da requisição
  const startTime = Date.now();
  
  // IP do cliente
  const ipAddress = req.ip || 
                   req.headers['x-forwarded-for']?.toString() || 
                   req.socket.remoteAddress;
  
  // User-Agent (navegador/dispositivo)
  const userAgent = req.headers['user-agent'];

  // Intercepta resposta para logar no final
  const originalSend = res.send;
  res.send = function (data) {
    const duration = Date.now() - startTime;
    
    // Aqui você chamaria logAuditEvent se for importante
    // Por enquanto, vamos deixar o cliente fazer isso
    
    return originalSend.call(this, data);
  };

  next();
}

// Adicione no seu server.js:
// app.use(auditLogMiddleware);
```

---

### 2️⃣ No Frontend - Apenas VIEW

No seu `useAuth` ou em um hook genérico:

```typescript
// src/hooks/useAudit.ts (NOVO)

import { useEffect } from 'react';
import { useAuth } from './useAuth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL!,
  process.env.REACT_APP_SUPABASE_ANON_KEY!
);

/**
 * Hook para logar VIEW automaticamente
 * Chame isso em cada página importante
 */
export function useAuditView(screenName: string, details?: any) {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.email) return;

    async function logView() {
      try {
        // Captura IP e User-Agent do cliente
        const ipResponse = await fetch('https://api.ipify.org?format=json').catch(
          () => null
        );
        const ipData = await ipResponse?.json();
        const ipAddress = ipData?.ip;

        const userAgent = navigator.userAgent;

        // Registra no banco
        await supabase.from('audit_logs').insert({
          user_id: user.id,
          user_email: user.email,
          action: 'VIEW',
          resource: screenName,
          ip_address: ipAddress,
          user_agent: userAgent,
          status: 'success',
          details: details || null,
          created_at: new Date().toISOString()
        });

        console.log(`✅ Registrou acesso: ${screenName}`);
      } catch (error) {
        console.error('❌ Erro ao registrar audit:', error);
      }
    }

    logView();
  }, [user?.email, screenName]);
}
```

---

### 3️⃣ Use em Cada Página Importante

```typescript
// src/pages/DashboardPage.tsx

import { useAuditView } from '@/hooks/useAudit';

export function DashboardPage() {
  // Registra automaticamente que acessou
  useAuditView('Dashboard', {
    viewport: 'desktop',
    tabs: ['proposals', 'contratos', 'financeiro']
  });

  return (
    <div>
      {/* seu dashboard */}
    </div>
  );
}
```

```typescript
// src/pages/PropostasPage.tsx

import { useAuditView } from '@/hooks/useAudit';

export function PropostasPage() {
  // Registra que acessou Propostas
  useAuditView('Propostas', {
    listType: 'all',
    pagination: { page: 1, limit: 100 }
  });

  return (
    <div>
      {/* suas propostas */}
    </div>
  );
}
```

---

## 📊 Dashboard de Auditoria (Simples)

```typescript
// src/pages/admin/AuditDashboard.tsx

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL!,
  process.env.REACT_APP_SUPABASE_ANON_KEY!
);

interface AuditLog {
  id: string;
  user_email: string;
  action: string;
  resource: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
  details: any;
  status: string;
}

export function AuditDashboard() {
  const { user } = useAuth();
  const { isMaster } = usePermissions();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  if (!isMaster) {
    return <div className="p-8 text-center text-red-500">Sem permissão</div>;
  }

  useEffect(() => {
    loadLogs();
    loadStats();
  }, []);

  async function loadLogs() {
    const { data } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    setLogs(data || []);
    setLoading(false);
  }

  async function loadStats() {
    const { data } = await supabase
      .from('audit_logs')
      .select('action, resource, user_email')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (!data) return;

    const stats = {
      totalAcessos: data.length,
      porTela: {} as Record<string, number>,
      porUsuario: {} as Record<string, number>,
      ultimoAcesso: new Date(data[0]?.created_at).toLocaleString('pt-BR')
    };

    data.forEach((log) => {
      stats.porTela[log.resource] = (stats.porTela[log.resource] || 0) + 1;
      stats.porUsuario[log.user_email] = (stats.porUsuario[log.user_email] || 0) + 1;
    });

    setStats(stats);
  }

  if (loading) return <div className="p-8 text-center">Carregando...</div>;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">📊 Auditoria - Quem Acessou O Quê</h1>

        {/* STATS */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Total Acessos */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-gray-600 text-sm font-medium mb-2">
                Total Acessos (7 dias)
              </h3>
              <p className="text-4xl font-bold text-blue-600">{stats.totalAcessos}</p>
              <p className="text-sm text-gray-600 mt-2">Último: {stats.ultimoAcesso}</p>
            </div>

            {/* Top Telas */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-gray-600 text-sm font-medium mb-4">Telas Mais Acessadas</h3>
              <div className="space-y-2">
                {Object.entries(stats.porTela)
                  .sort(([, a], [, b]) => (b as number) - (a as number))
                  .slice(0, 5)
                  .map(([tela, count]) => (
                    <div key={tela} className="flex justify-between text-sm">
                      <span className="font-medium">{tela}</span>
                      <span className="text-gray-600">{count}x</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Top Usuários */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-gray-600 text-sm font-medium mb-4">Usuários Mais Ativos</h3>
              <div className="space-y-2">
                {Object.entries(stats.porUsuario)
                  .sort(([, a], [, b]) => (b as number) - (a as number))
                  .slice(0, 5)
                  .map(([email, count]) => (
                    <div key={email} className="flex justify-between text-sm">
                      <span className="text-xs">{email.split('@')[0]}</span>
                      <span className="text-gray-600 font-medium">{count}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* TABELA DE LOGS */}
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-gray-700">Data/Hora</th>
                <th className="px-6 py-3 text-left font-medium text-gray-700">Usuário</th>
                <th className="px-6 py-3 text-left font-medium text-gray-700">Tela</th>
                <th className="px-6 py-3 text-left font-medium text-gray-700">IP</th>
                <th className="px-6 py-3 text-left font-medium text-gray-700">Navegador</th>
                <th className="px-6 py-3 text-left font-medium text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-gray-600 text-xs">
                    {new Date(log.created_at).toLocaleString('pt-BR')}
                  </td>
                  <td className="px-6 py-3 font-medium text-sm">
                    {log.user_email.split('@')[0]}
                  </td>
                  <td className="px-6 py-3 font-mono text-sm text-blue-600">
                    {log.resource}
                  </td>
                  <td className="px-6 py-3 text-gray-600 font-mono text-xs">
                    {log.ip_address || '-'}
                  </td>
                  <td className="px-6 py-3 text-gray-600 text-xs">
                    {log.user_agent
                      ? log.user_agent.split(' ').slice(0, 2).join(' ')
                      : '-'}
                  </td>
                  <td className="px-6 py-3">
                    {log.status === 'success' ? (
                      <span className="text-green-600 font-medium">✅ OK</span>
                    ) : (
                      <span className="text-red-600 font-medium">❌ Erro</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
```

---

## ✅ CHECKLIST ULTRA-SIMPLES

- [ ] Criar `src/hooks/useAudit.ts` (captura IP + User-Agent)
- [ ] Adicionar `useAuditView('Dashboard')` em cada página importante
- [ ] Criar `src/pages/admin/AuditDashboard.tsx` (mostra quem acessou o quê)
- [ ] Testar: acessar uma página e ver aparecer no dashboard
- [ ] Pronto! Você tem auditoria completa

---

## 🎯 RESUMO

**O QUE JÁ FUNCIONA:**
- ✅ LOGIN/LOGOUT
- ✅ VIEW (qual tela)
- ✅ Timestamp
- ✅ Email do usuário
- ✅ Status

**O QUE ADICIONAR:**
- ➕ IP Address
- ➕ User-Agent (navegador)
- ➕ Dashboard visual

**PRONTO! Você tem compliance.**

---

Qual arquivo quer que eu crie PRIMEIRO?

- [ ] `useAudit.ts` (hook para capturar dados)?
- [ ] `AuditDashboard.tsx` (interface admin)?
- [ ] Os dois?

Fala! 🚀
