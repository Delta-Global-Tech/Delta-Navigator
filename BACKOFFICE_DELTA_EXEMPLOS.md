# 💻 Exemplos Práticos - Backoffice Delta

## 📚 Guia com Exemplos Reais

Exemplos de como usar o Backoffice Delta em diferentes cenários.

## 1️⃣ Usar o Serviço Diretamente em um Componente

### Exemplo: Componente Customizado

```typescript
// src/components/MyCustomPixComponent.tsx
import React, { useEffect, useState } from 'react';
import { pixLimitService, PixLimitResponse } from '@/services/pixLimitService';
import { useToast } from '@/hooks/use-toast';

export function MyCustomPixComponent() {
  const [limits, setLimits] = useState<PixLimitResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadLimits();
  }, []);

  const loadLimits = async () => {
    try {
      setLoading(true);
      const data = await pixLimitService.getPixLimit(158);
      setLimits(data);
      toast({
        title: 'Sucesso',
        description: 'Limites carregados com sucesso'
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao carregar limites',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!limits) return <div>Carregando...</div>;

  return (
    <div>
      <h2>Limites Atuais</h2>
      <p>PIX Interno - Diurno: R$ {limits.pixLimitInternal.dayLimit}</p>
      <p>PIX Externo - Noturno: R$ {limits.pixLimitExternal.nightLimit}</p>
      <p>Saque PIX - Diurno: R$ {limits.pixLimitWithdraw.dayLimit}</p>
    </div>
  );
}
```

## 2️⃣ Atualizar Múltiplas Contas em Lote

### Exemplo: Batch Update

```typescript
// src/utils/batchUpdateLimits.ts
import { pixLimitService, PixLimitResponse } from '@/services/pixLimitService';

interface BatchUpdate {
  accountId: number;
  newDayLimit: number;
  newNightLimit: number;
}

export async function batchUpdateLimits(updates: BatchUpdate[]) {
  const results = {
    success: [] as number[],
    failed: [] as { accountId: number; error: string }[]
  };

  for (const update of updates) {
    try {
      // Buscar limite atual
      const current = await pixLimitService.getPixLimit(update.accountId);

      // Atualizar valores
      const updated: PixLimitResponse = {
        pixLimitInternal: {
          ...current.pixLimitInternal,
          dayLimit: update.newDayLimit,
          nightLimit: update.newNightLimit,
          dayTransactionLimit: update.newDayLimit,
          nightTransactionLimit: update.newNightLimit
        },
        pixLimitExternal: {
          ...current.pixLimitExternal,
          dayLimit: update.newDayLimit,
          nightLimit: update.newNightLimit,
          dayTransactionLimit: update.newDayLimit,
          nightTransactionLimit: update.newNightLimit
        },
        pixLimitWithdraw: {
          ...current.pixLimitWithdraw,
          dayLimit: update.newDayLimit * 0.5,
          nightLimit: update.newNightLimit * 0.5,
          dayTransactionLimit: update.newDayLimit * 0.5,
          nightTransactionLimit: update.newNightLimit * 0.5
        }
      };

      // Salvar alterações
      await pixLimitService.updatePixLimit(update.accountId, updated);
      results.success.push(update.accountId);

    } catch (error) {
      results.failed.push({
        accountId: update.accountId,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  return results;
}

// Uso
const updates: BatchUpdate[] = [
  { accountId: 158, newDayLimit: 100000, newNightLimit: 50000 },
  { accountId: 159, newDayLimit: 80000, newNightLimit: 40000 },
  { accountId: 160, newDayLimit: 120000, newNightLimit: 60000 }
];

const results = await batchUpdateLimits(updates);
console.log(`✅ ${results.success.length} atualizado(s)`);
console.log(`❌ ${results.failed.length} falhou(aram)`);
```

## 3️⃣ Criar Dashboard de Limites

### Exemplo: Dashboard Customizado

```typescript
// src/components/PixLimitsDashboard.tsx
import React, { useEffect, useState } from 'react';
import { pixLimitService, PixLimitResponse } from '@/services/pixLimitService';
import { Card } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export function PixLimitsDashboard() {
  const [limits, setLimits] = useState<PixLimitResponse | null>(null);

  useEffect(() => {
    pixLimitService.getPixLimit(158).then(setLimits);
  }, []);

  if (!limits) return null;

  const chartData = [
    {
      category: 'PIX Interno',
      diurno: limits.pixLimitInternal.dayLimit,
      noturno: limits.pixLimitInternal.nightLimit
    },
    {
      category: 'PIX Externo',
      diurno: limits.pixLimitExternal.dayLimit,
      noturno: limits.pixLimitExternal.nightLimit
    },
    {
      category: 'Saque PIX',
      diurno: limits.pixLimitWithdraw.dayLimit,
      noturno: limits.pixLimitWithdraw.nightLimit
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <h2>Comparativo de Limites</h2>
        <BarChart data={chartData} width={500} height={300}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="category" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="diurno" fill="#8884d8" name="Diurno" />
          <Bar dataKey="noturno" fill="#82ca9d" name="Noturno" />
        </BarChart>
      </Card>

      <Card>
        <h2>Detalhes</h2>
        <table className="w-full">
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Limite Diurno</th>
              <th>Limite Noturno</th>
              <th>Diferença</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>PIX Interno</td>
              <td>R$ {limits.pixLimitInternal.dayLimit.toLocaleString('pt-BR')}</td>
              <td>R$ {limits.pixLimitInternal.nightLimit.toLocaleString('pt-BR')}</td>
              <td>R$ {(limits.pixLimitInternal.dayLimit - limits.pixLimitInternal.nightLimit).toLocaleString('pt-BR')}</td>
            </tr>
            <tr>
              <td>PIX Externo</td>
              <td>R$ {limits.pixLimitExternal.dayLimit.toLocaleString('pt-BR')}</td>
              <td>R$ {limits.pixLimitExternal.nightLimit.toLocaleString('pt-BR')}</td>
              <td>R$ {(limits.pixLimitExternal.dayLimit - limits.pixLimitExternal.nightLimit).toLocaleString('pt-BR')}</td>
            </tr>
            <tr>
              <td>Saque PIX</td>
              <td>R$ {limits.pixLimitWithdraw.dayLimit.toLocaleString('pt-BR')}</td>
              <td>R$ {limits.pixLimitWithdraw.nightLimit.toLocaleString('pt-BR')}</td>
              <td>R$ {(limits.pixLimitWithdraw.dayLimit - limits.pixLimitWithdraw.nightLimit).toLocaleString('pt-BR')}</td>
            </tr>
          </tbody>
        </table>
      </Card>
    </div>
  );
}
```

## 4️⃣ Aprovar/Recusar Múltiplas Solicitações

### Exemplo: Processamento em Lote

```typescript
// src/utils/processBulkRequests.ts
import { pixLimitService } from '@/services/pixLimitService';

interface BulkAction {
  requestIds: number[];
  action: 'approve' | 'reject';
  reason?: string;
}

export async function processBulkRequests({ 
  requestIds, 
  action, 
  reason 
}: BulkAction) {
  const results = {
    approved: [] as number[],
    rejected: [] as number[],
    errors: [] as { id: number; error: string }[]
  };

  for (const requestId of requestIds) {
    try {
      await pixLimitService.processLimitRequest({
        status: action === 'approve' ? 'A' : 'N',
        requestId,
        rejectionReason: reason || ''
      });

      if (action === 'approve') {
        results.approved.push(requestId);
      } else {
        results.rejected.push(requestId);
      }
    } catch (error) {
      results.errors.push({
        id: requestId,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  return results;
}

// Uso
const bulkApprove = async () => {
  const results = await processBulkRequests({
    requestIds: [550, 551, 552],
    action: 'approve'
  });
  
  console.log(`✅ Aprovadas: ${results.approved.length}`);
  console.log(`❌ Erros: ${results.errors.length}`);
};

const bulkReject = async () => {
  const results = await processBulkRequests({
    requestIds: [553, 554],
    action: 'reject',
    reason: 'Limite máximo de transações atingido'
  });
  
  console.log(`✅ Recusadas: ${results.rejected.length}`);
};
```

## 5️⃣ Validação de Limites

### Exemplo: Validators

```typescript
// src/utils/pixLimitValidators.ts
import { PixLimit } from '@/services/pixLimitService';

export function validatePixLimit(limit: PixLimit): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validar hora do turno noturno
  const [hours, minutes, seconds] = limit.startNightTime.split(':').map(Number);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    errors.push('Hora de início noturno inválida');
  }

  // Validar limites positivos
  if (limit.dayLimit <= 0) {
    errors.push('Limite diurno deve ser maior que zero');
  }
  if (limit.nightLimit <= 0) {
    errors.push('Limite noturno deve ser maior que zero');
  }

  // Validar limite de transação
  if (limit.dayTransactionLimit > limit.dayLimit) {
    errors.push('Limite por transação diurno não pode ser maior que limite diurno');
  }
  if (limit.nightTransactionLimit > limit.nightLimit) {
    errors.push('Limite por transação noturno não pode ser maior que limite noturno');
  }

  // Validar status
  if (limit.status !== 0 && limit.status !== 1) {
    errors.push('Status deve ser 0 ou 1');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// Uso
const pixLimit: PixLimit = {
  startNightTime: '20:00:00',
  dayLimit: 58306.43,
  dayTransactionLimit: 58306.43,
  nightLimit: 10000,
  nightTransactionLimit: 10000,
  status: 0
};

const validation = validatePixLimit(pixLimit);
if (!validation.valid) {
  console.error('Erros de validação:', validation.errors);
} else {
  console.log('✅ Limite válido');
}
```

## 6️⃣ Exportar Solicitações para CSV

### Exemplo: Export CSV

```typescript
// src/utils/exportToCSV.ts
import { RaiseLimitRequest } from '@/services/pixLimitService';

export function exportRequestsToCSV(requests: RaiseLimitRequest[]) {
  const headers = [
    'ID',
    'CPF/CNPJ',
    'Valor Solicitado',
    'Data/Hora',
    'Turno',
    'Cobertura',
    'Status',
    'Status BackOffice',
    'Motivo Rejeição'
  ];

  const rows = requests.map(req => [
    req.id,
    req.document,
    req.requestedValue.toLocaleString('pt-BR'),
    new Date(req.requestDateTime).toLocaleString('pt-BR'),
    req.shift === 'D' ? 'Diurno' : 'Noturno',
    req.coverage === 'P' ? 'PIX' : 'Transferência',
    req.status === 'S' ? 'Solicitado' : req.status === 'A' ? 'Aprovado' : 'Recusado',
    req.statusBackOffice === 'A' ? 'Aprovado' : 'Pendente',
    req.rejectionReason || ''
  ]);

  // Criar CSV
  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  // Download
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `solicitacoes-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
}

// Uso
const requests = await pixLimitService.getRaiseLimitRequests(265);
exportRequestsToCSV(requests.raiseLimitRequests);
```

## 7️⃣ Notificações em Tempo Real

### Exemplo: Polling de Solicitações

```typescript
// src/hooks/usePixLimitRequests.ts
import { useState, useEffect } from 'react';
import { pixLimitService, RaiseLimitRequest } from '@/services/pixLimitService';

export function usePixLimitRequests(accountId: number, interval = 30000) {
  const [requests, setRequests] = useState<RaiseLimitRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const data = await pixLimitService.getRaiseLimitRequests(accountId);
        setRequests(data.raiseLimitRequests);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    fetch();
    const timer = setInterval(fetch, interval);

    return () => clearInterval(timer);
  }, [accountId, interval]);

  return { requests, loading, error };
}

// Uso
function MyComponent() {
  const { requests, loading } = usePixLimitRequests(265, 30000);

  return (
    <div>
      <p>Solicitações pendentes: {requests.length}</p>
      {loading && <span>Atualizando...</span>}
      {/* Renderizar requests */}
    </div>
  );
}
```

## 8️⃣ Relatório de Atividades

### Exemplo: Report Generator

```typescript
// src/utils/generateActivityReport.ts
import { RaiseLimitRequest } from '@/services/pixLimitService';

export interface ActivityReport {
  total: number;
  approved: number;
  rejected: number;
  pending: number;
  averageValue: number;
  topRequests: RaiseLimitRequest[];
  timeline: { date: string; count: number }[];
}

export function generateActivityReport(
  requests: RaiseLimitRequest[]
): ActivityReport {
  const approved = requests.filter(r => r.status === 'A').length;
  const rejected = requests.filter(r => r.status === 'N').length;
  const pending = requests.filter(r => r.status === 'S').length;

  const totalValue = requests.reduce((sum, r) => sum + r.requestedValue, 0);
  const averageValue = totalValue / requests.length;

  // Top 5 maiores requisições
  const topRequests = [...requests]
    .sort((a, b) => b.requestedValue - a.requestedValue)
    .slice(0, 5);

  // Timeline por dia
  const timeline = requests.reduce((acc, req) => {
    const date = new Date(req.requestDateTime).toLocaleDateString('pt-BR');
    const existing = acc.find(item => item.date === date);
    if (existing) {
      existing.count++;
    } else {
      acc.push({ date, count: 1 });
    }
    return acc;
  }, [] as { date: string; count: number }[]);

  return {
    total: requests.length,
    approved,
    rejected,
    pending,
    averageValue,
    topRequests,
    timeline
  };
}

// Uso
const requests = await pixLimitService.getRaiseLimitRequests(265);
const report = generateActivityReport(requests.raiseLimitRequests);

console.log(`📊 Relatório de Atividades`);
console.log(`Total: ${report.total}`);
console.log(`Aprovadas: ${report.approved}`);
console.log(`Recusadas: ${report.rejected}`);
console.log(`Pendentes: ${report.pending}`);
console.log(`Valor Médio: R$ ${report.averageValue.toFixed(2)}`);
```

## 🎯 Casos de Uso Completos

### Caso 1: Integração com Sistema de Automação

```typescript
// src/automation/autoApproveLowValues.ts
import { pixLimitService } from '@/services/pixLimitService';

const AUTO_APPROVE_THRESHOLD = 5000; // Aprovar automaticamente valores <= 5k

export async function autoApproveLowValueRequests(accountId: number) {
  try {
    const data = await pixLimitService.getRaiseLimitRequests(accountId);
    
    for (const request of data.raiseLimitRequests) {
      if (request.status === 'S' && request.requestedValue <= AUTO_APPROVE_THRESHOLD) {
        await pixLimitService.processLimitRequest({
          status: 'A',
          requestId: request.id,
          rejectionReason: ''
        });
        
        console.log(`✅ Auto-aprovada solicitação #${request.id}`);
      }
    }
  } catch (error) {
    console.error('Erro na automação:', error);
  }
}
```

### Caso 2: Sincronização com Sistema Externo

```typescript
// src/integrations/syncWithLegacySystem.ts
import { pixLimitService } from '@/services/pixLimitService';

export async function syncLimitsWithLegacySystem(accountId: number) {
  // Buscar limites atuais
  const limits = await pixLimitService.getPixLimit(accountId);

  // Enviar para sistema legado
  const response = await fetch('https://legacy-system.com/api/limits', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      accountId,
      limits,
      syncedAt: new Date().toISOString()
    })
  });

  return response.json();
}
```

---

**Próximas seções:** Testes unitários, integração com outras APIs, monitoramento...
