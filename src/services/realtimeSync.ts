/**
 * Serviço de Sincronização com Supabase Realtime
 * Sincroniza requisições em tempo real entre múltiplos PCs
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[RealtimeSync] ❌ Variáveis de ambiente do Supabase não configuradas');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface RealtimeMetric {
  id: number;
  backend: string;
  endpoint: string;
  page?: string;
  user_name?: string;
  pc_name: string;
  duration: number;
  status: 'success' | 'error' | 'pending';
  status_code?: number;
  created_at: string;
}

// Listeners para mudanças em tempo real
let realtimeListeners: ((metrics: RealtimeMetric[]) => void)[] = [];
let realtimeSubscription: any = null;
let isRealtimeSyncEnabled = false; // DESABILITAR POR PADRÃO PARA EVITAR LOOP

/**
 * Obter nome do PC
 */
export function getPCName(): string {
  // Primeiro, tentar usar um ID único de sessão
  if (!sessionStorage.getItem('pc_session_id')) {
    // Usar um identificador baseado no navegador e timestamp
    const userAgent = navigator.userAgent.substring(0, 20);
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const pcId = `${userAgent}-${timestamp}-${random}`.substring(0, 30);
    
    sessionStorage.setItem('pc_session_id', pcId);
  }
  
  return sessionStorage.getItem('pc_session_id') || 'UnknownPC';
}

/**
 * Enviar métrica para Supabase
 */
export async function sendMetricToSupabase(
  backend: string,
  endpoint: string,
  page: string | undefined,
  user: string,
  duration: number,
  status: 'success' | 'error' | 'pending',
  statusCode?: number
): Promise<void> {
  // DESABILITAR ENVIO PARA EVITAR LOOP INFINITO
  if (!isRealtimeSyncEnabled) {
    return;
  }

  try {
    const pcName = getPCName();
    
    const { error } = await supabase
      .from('monitoring_metrics')
      .insert([
        {
          backend,
          endpoint,
          page: page || 'Unknown',
          user_name: user || 'Anonymous',
          pc_name: pcName,
          duration,
          status,
          status_code: statusCode,
          request_count: 1
        }
      ]);

    if (error) {
      console.error('[RealtimeSync] ❌ Erro ao enviar métrica:', error);
    } else {
      // console.log(`[RealtimeSync] ✅ Métrica enviada: ${backend} - ${endpoint}`);
    }
  } catch (e) {
    console.error('[RealtimeSync] ❌ Erro ao enviar para Supabase:', e);
  }
}

/**
 * Inicializar listener de Realtime
 */
export function initializeRealtimeSync(): void {
  try {
    console.log('[RealtimeSync] 🚀 Inicializando sincronização Realtime');

    // Inscrever em mudanças da tabela
    realtimeSubscription = supabase
      .channel('public:monitoring_metrics')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'monitoring_metrics'
        },
        (payload) => {
          console.log('[RealtimeSync] 📡 Novo evento recebido:', payload.eventType);
          
          // Notificar listeners
          notifyRealtimeListeners();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[RealtimeSync] ✅ Inscrito ao canal de Realtime');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[RealtimeSync] ❌ Erro ao conectar ao Realtime');
        } else if (status === 'TIMED_OUT') {
          console.warn('[RealtimeSync] ⚠️ Timeout na conexão com Realtime');
        }
      });
  } catch (e) {
    console.error('[RealtimeSync] ❌ Erro ao inicializar Realtime:', e);
  }
}

/**
 * Buscar métricas recentes
 */
export async function fetchRecentMetrics(limitMinutes: number = 5, limit: number = 100): Promise<RealtimeMetric[]> {
  try {
    const cutoffTime = new Date(Date.now() - limitMinutes * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('monitoring_metrics')
      .select('*')
      .gte('created_at', cutoffTime)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[RealtimeSync] ❌ Erro ao buscar métricas:', error);
      return [];
    }

    return (data as RealtimeMetric[]) || [];
  } catch (e) {
    console.error('[RealtimeSync] ❌ Erro ao buscar métricas:', e);
    return [];
  }
}

/**
 * Buscar métricas por filtros
 */
export async function fetchMetricsWithFilters(
  backend?: string,
  pcName?: string,
  user?: string,
  status?: string,
  limit: number = 100
): Promise<RealtimeMetric[]> {
  try {
    let query = supabase
      .from('monitoring_metrics')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (backend) {
      query = query.eq('backend', backend);
    }
    if (pcName) {
      query = query.eq('pc_name', pcName);
    }
    if (user) {
      query = query.eq('user_name', user);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[RealtimeSync] ❌ Erro ao buscar métricas com filtros:', error);
      return [];
    }

    return (data as RealtimeMetric[]) || [];
  } catch (e) {
    console.error('[RealtimeSync] ❌ Erro ao buscar métricas com filtros:', e);
    return [];
  }
}

/**
 * Subscrever a mudanças em tempo real
 */
export function subscribeToRealtime(callback: (metrics: RealtimeMetric[]) => void): () => void {
  realtimeListeners.push(callback);
  console.log('[RealtimeSync] ✅ Novo listener adicionado. Total:', realtimeListeners.length);

  return () => {
    realtimeListeners = realtimeListeners.filter(listener => listener !== callback);
    console.log('[RealtimeSync] ✅ Listener removido. Total:', realtimeListeners.length);
  };
}

/**
 * Notificar todos os listeners
 */
async function notifyRealtimeListeners(): Promise<void> {
  try {
    const metrics = await fetchRecentMetrics(5, 200);
    
    realtimeListeners.forEach(listener => {
      try {
        listener(metrics);
      } catch (e) {
        console.error('[RealtimeSync] ❌ Erro ao notificar listener:', e);
      }
    });
  } catch (e) {
    console.error('[RealtimeSync] ❌ Erro ao notificar listeners:', e);
  }
}

/**
 * Limpar tabela de métricas antigas (mais de 24h)
 */
export async function cleanOldMetrics(hoursAgo: number = 24): Promise<void> {
  try {
    const cutoffTime = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();

    const { error } = await supabase
      .from('monitoring_metrics')
      .delete()
      .lt('created_at', cutoffTime);

    if (error) {
      console.error('[RealtimeSync] ❌ Erro ao limpar métricas antigas:', error);
    } else {
      console.log(`[RealtimeSync] ✅ Métricas mais antigas que ${hoursAgo}h removidas`);
    }
  } catch (e) {
    console.error('[RealtimeSync] ❌ Erro ao limpar métricas:', e);
  }
}

/**
 * Obter estatísticas de PCs ativos
 */
export async function getActivePCStats(): Promise<
  Array<{ pc_name: string; request_count: number; last_request: string }>
> {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('monitoring_metrics')
      .select('pc_name, created_at')
      .gte('created_at', fiveMinutesAgo);

    if (error) {
      console.error('[RealtimeSync] ❌ Erro ao buscar stats de PC:', error);
      return [];
    }

    const stats = new Map<string, { count: number; lastRequest: string }>();

    (data as any[]).forEach((metric) => {
      if (!stats.has(metric.pc_name)) {
        stats.set(metric.pc_name, { count: 0, lastRequest: metric.created_at });
      }
      const stat = stats.get(metric.pc_name)!;
      stat.count++;
      if (new Date(metric.created_at) > new Date(stat.lastRequest)) {
        stat.lastRequest = metric.created_at;
      }
    });

    return Array.from(stats.entries()).map(([pc_name, stat]) => ({
      pc_name,
      request_count: stat.count,
      last_request: stat.lastRequest
    }));
  } catch (e) {
    console.error('[RealtimeSync] ❌ Erro ao buscar stats de PC:', e);
    return [];
  }
}

/**
 * Exportar métricas como CSV
 */
export async function exportMetricsAsCSV(limitMinutes: number = 60): Promise<string> {
  try {
    const metrics = await fetchRecentMetrics(limitMinutes, 1000);

    if (metrics.length === 0) {
      return 'No data available';
    }

    const headers = ['ID', 'Backend', 'Endpoint', 'Page', 'User', 'PC', 'Duration (ms)', 'Status', 'Timestamp'];
    const rows = metrics.map(m => [
      m.id,
      m.backend,
      m.endpoint,
      m.page || '-',
      m.user_name || '-',
      m.pc_name,
      m.duration.toFixed(2),
      m.status,
      new Date(m.created_at).toLocaleString()
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csv;
  } catch (e) {
    console.error('[RealtimeSync] ❌ Erro ao exportar CSV:', e);
    return '';
  }
}

/**
 * Habilitar/Desabilitar sincronização Realtime
 */
export function setRealtimeSyncEnabled(enabled: boolean): void {
  isRealtimeSyncEnabled = enabled;
  console.log(`[RealtimeSync] 🔄 Realtime Sync ${enabled ? 'HABILITADO' : 'DESABILITAR'}`);
}
