/**
 * Serviço Global de Monitoramento de Requisições
 * Intercepta TODAS as function recordMetric(url: string, duration: number, status: 'success' | 'error' | 'pending', statusCode?: number): void {
  try {
    const cleanEndpoint = url.split('?')[0];
    const backend = extractBackend(url);
    const page = sessionStorage.getItem('currentPage') || 'Unknown';
    const user = currentUser;
    const key = `${backend}|${cleanEndpoint}`;

    totalRequests++;

    // Logs desabilitados para reduzir spam no console em produção
    // console.log(`[RequestMonitoring] 🔴🔴 CHAMANDO recordMetric: url=${url}, backend=${backend}, page=${page}, status=${status}`);
    // console.log(`[RequestMonitoring] 📊 Métrica #${totalRequests}: backend=${backend}, page=${page}, status=${status}, duration=${duration.toFixed(2)}ms`);fetch da aplicação
 * Armazena dados em localStorage e Supabase para persist entre páginas
 */

import { addRequestAlert } from './requestAlerts';
import { sendMetricToSupabase } from './realtimeSync';

export interface MonitoringMetric {
  id: string;
  backend: string;
  endpoint: string;
  page: string;
  user: string; // Novo: usuário que fez a requisição
  count: number;
  totalTime: number;
  avgTime: number;
  lastTime: number;
  timestamp: number;
  status: 'success' | 'error' | 'pending';
  statusCode?: number;
}

const STORAGE_KEY = 'requestMonitoring_metrics';
const MAX_METRICS = 1000;

// Estado global do monitoring
let metricsMap = new Map<string, MonitoringMetric>();
let totalRequests = 0;
let isInterceptorActive = false;
let requestListeners: ((metrics: MonitoringMetric[]) => void)[] = [];
let currentUser = 'Anonymous'; // Novo: armazenar usuário atual
let supabaseSyncQueue: Array<{
  backend: string;
  endpoint: string;
  page: string;
  user: string;
  duration: number;
  status: 'success' | 'error' | 'pending';
  statusCode?: number;
}> = [];
let supabaseSyncInterval: NodeJS.Timeout | null = null;
let isSupabaseSyncEnabled = false; // DESABILITAR ENVIO PARA SUPABASE PARA EVITAR LOOP

/**
 * Extrair backend da URL baseado na porta
 */
function extractBackend(url: string): string {
  try {
    const urlObj = new URL(url);
    const port = urlObj.port;
    
    const portToBackend: { [key: string]: string } = {
      '3001': 'SQLSERVER',
      '3002': 'POSTGRES',
      '3003': 'EXTRATO',
      '3004': 'CONTRATOS',
      '3005': 'IUGU',
    };
    
    if (port && portToBackend[port]) {
      return portToBackend[port];
    }

    if (url.includes(':3001')) return 'SQLSERVER';
    if (url.includes(':3002')) return 'POSTGRES';
    if (url.includes(':3003')) return 'EXTRATO';
    if (url.includes(':3004')) return 'CONTRATOS';
    if (url.includes(':3005')) return 'IUGU';
    
    return 'UNKNOWN';
  } catch (e) {
    return 'UNKNOWN';
  }
}

/**
 * Registrar uma métrica de requisição
 */
function recordMetric(url: string, duration: number, status: 'success' | 'error' | 'pending', statusCode?: number): void {
  // DESABILITAR COMPLETAMENTE PARA EVITAR LOOP
  return;
  
  try {
    const cleanEndpoint = url.split('?')[0];
    const backend = extractBackend(url);
    const page = sessionStorage.getItem('currentPage') || 'Unknown';
    const user = currentUser;
    const key = `${backend}|${cleanEndpoint}`;

    totalRequests++;

    console.log(`[RequestMonitoring] �🔴🔴 CHAMANDO recordMetric: url=${url}, backend=${backend}, page=${page}, status=${status}`);
    console.log(`[RequestMonitoring] �📊 Métrica #${totalRequests}: backend=${backend}, page=${page}, status=${status}, duration=${duration.toFixed(2)}ms`);

    const existingMetric = metricsMap.get(key);

    if (existingMetric) {
      existingMetric.count++;
      existingMetric.totalTime += duration;
      existingMetric.avgTime = existingMetric.totalTime / existingMetric.count;
      existingMetric.lastTime = duration;
      existingMetric.timestamp = Date.now();
      if (status === 'error') existingMetric.status = 'error';
      if (statusCode) existingMetric.statusCode = statusCode;
    } else {
      const newMetric: MonitoringMetric = {
        id: key,
        backend,
        page,
        user,
        endpoint: cleanEndpoint.length > 60 ? cleanEndpoint.substring(cleanEndpoint.lastIndexOf('/')) : cleanEndpoint,
        count: 1,
        totalTime: duration,
        avgTime: duration,
        lastTime: duration,
        timestamp: Date.now(),
        status,
        statusCode
      };
      metricsMap.set(key, newMetric);
    }

    // Limitar o número de métricas para evitar memory leak
    if (metricsMap.size > MAX_METRICS) {
      const firstKey = Array.from(metricsMap.keys())[0];
      if (firstKey) metricsMap.delete(firstKey);
    }

    // Notificar listeners
    // console.log(`[RequestMonitoring] ✅ Notificando ${requestListeners.length} listeners... metricsMap.size=${metricsMap.size}`);
    notifyListeners();

    // Adicionar à fila de sincronização com Supabase
    queueSupabaseSync({
      backend,
      endpoint: cleanEndpoint,
      page,
      user,
      duration,
      status,
      statusCode
    });

    // Log do monitoring
    console.log(
      `[RequestMonitoring] #${totalRequests} | ${backend} | ${status} | ${duration.toFixed(2)}ms | ${cleanEndpoint.substring(cleanEndpoint.lastIndexOf('/'))}`
    );
  } catch (e) {
    console.error('[RequestMonitoring] ❌ ERRO em recordMetric:', e);
  }
}

/**
 * Adicionar métrica à fila de sincronização com Supabase (com debounce)
 */
function queueSupabaseSync(metric: {
  backend: string;
  endpoint: string;
  page: string;
  user: string;
  duration: number;
  status: 'success' | 'error' | 'pending';
  statusCode?: number;
}): void {
  // DESABILITAR ENVIO PARA SUPABASE - CRIAR LOOP INFINITO DE REQUISIÇÕES
  if (!isSupabaseSyncEnabled) {
    return;
  }
  
  supabaseSyncQueue.push(metric);
  
  // Se já existe intervalo, não cria outro
  if (supabaseSyncInterval !== null) {
    return;
  }

  // Enviar em lote a cada 2 segundos (debounce)
  supabaseSyncInterval = setInterval(() => {
    flushSupabaseSync();
  }, 2000);
}

/**
 * Enviar todas as métricas da fila para Supabase
 */
async function flushSupabaseSync(): Promise<void> {
  if (supabaseSyncQueue.length === 0) {
    if (supabaseSyncInterval !== null) {
      clearInterval(supabaseSyncInterval);
      supabaseSyncInterval = null;
    }
    return;
  }

  const batch = supabaseSyncQueue.splice(0, 50); // Enviar até 50 por vez
  
  // console.log(`[RequestMonitoring] 📤 Enviando ${batch.length} métricas para Supabase...`);

  for (const metric of batch) {
    try {
      await sendMetricToSupabase(
        metric.backend,
        metric.endpoint,
        metric.page,
        metric.user,
        metric.duration,
        metric.status,
        metric.statusCode
      );
    } catch (e) {
      console.error('[RequestMonitoring] ❌ Erro ao enviar métrica para Supabase:', e);
    }
  }

  // Se ainda há itens na fila, agendar outro envio
  if (supabaseSyncQueue.length > 0 && supabaseSyncInterval === null) {
    supabaseSyncInterval = setInterval(() => {
      flushSupabaseSync();
    }, 2000);
  } else if (supabaseSyncQueue.length === 0 && supabaseSyncInterval !== null) {
    clearInterval(supabaseSyncInterval);
    supabaseSyncInterval = null;
  }
}

/**
 * Notificar todos os listeners sobre mudanças
 */
function notifyListeners(): void {
  const metricsArray = Array.from(metricsMap.values());
  requestListeners.forEach(listener => {
    try {
      listener(metricsArray);
    } catch (e) {
      console.error('[RequestMonitoring] Erro ao notificar listener:', e);
    }
  });
}

/**
 * Inicializar o interceptor global de fetch
 * Deve ser chamado uma única vez na inicialização da app
 */
export function initializeRequestMonitoring(): void {
  if (isInterceptorActive) {
    console.warn('[RequestMonitoring] Interceptor já está ativo');
    return;
  }

  console.log('[RequestMonitoring] 🚀 INICIALIZANDO - Versão Simplificada');

  // Guardar fetch original
  const originalFetch = window.fetch.bind(window);

  // Criar wrapper simples
  const wrappedFetch = async function(...args: any[]) {
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || 'unknown';
    const startTime = performance.now();

    // console.log(`[RequestMonitoring] 📥 Fetch iniciado: ${url}`);

    try {
      const response = await originalFetch(...args);
      const duration = performance.now() - startTime;
      const status = response.ok ? 'success' : 'error';

      // console.log(`[RequestMonitoring] 📤 Fetch concluído: ${status} - ${duration.toFixed(2)}ms`);
      recordMetric(url, duration, status, response.status);
      
      // Adicionar alerta visual
      addRequestAlert(extractBackend(url), url, status, duration);

      return response;
    } catch (error: any) {
      const duration = performance.now() - startTime;
      // console.log(`[RequestMonitoring] ❌ Fetch erro: ${duration.toFixed(2)}ms - ${error.message}`);
      recordMetric(url, duration, 'error');
      addRequestAlert(extractBackend(url), url, 'error', duration);
      throw error;
    }
  };

  // Tentar substituir fetch
  try {
    (window as any).fetch = wrappedFetch;
    (window as any).__originalFetch = originalFetch;
    (window as any).__monitoringInterceptorLocked = true;
    
    console.log('[RequestMonitoring] ✅ Fetch interceptado com sucesso');
    
    // Verificar
    if (window.fetch === wrappedFetch) {
      console.log('[RequestMonitoring] ✅ Verificação: Fetch está realmente interceptado');
    } else {
      console.warn('[RequestMonitoring] ⚠️ Verificação falhou: Fetch pode ter sido substituído');
    }
  } catch (e) {
    console.error('[RequestMonitoring] ❌ Erro ao interceptar fetch:', e);
  }

  isInterceptorActive = true;
  console.log('[RequestMonitoring] ✅✅✅ Interceptor INICIALIZADO');
}

/**
 * Obter todas as métricas
 */
export function getMetrics(): MonitoringMetric[] {
  return Array.from(metricsMap.values());
}

/**
 * Obter total de requisições
 */
export function getTotalRequests(): number {
  return totalRequests;
}

/**
 * Subscrever a mudanças de métricas
 */
export function subscribeToMetrics(callback: (metrics: MonitoringMetric[]) => void): () => void {
  requestListeners.push(callback);

  // Retornar função de desinscrição
  return () => {
    requestListeners = requestListeners.filter(listener => listener !== callback);
  };
}

/**
 * Limpar todas as métricas
 */
export function clearMetrics(): void {
  metricsMap.clear();
  totalRequests = 0;
  notifyListeners();
  console.log('[RequestMonitoring] Métricas limpas');
}

/**
 * Exportar métricas como JSON
 */
export function exportMetrics() {
  const data = {
    timestamp: new Date().toISOString(),
    totalRequests,
    metrics: Array.from(metricsMap.values()),
    summary: {
      totalEndpoints: metricsMap.size,
      backendCount: new Set(Array.from(metricsMap.values()).map(m => m.backend)).size
    }
  };

  return data;
}

/**
 * Definir o usuário atual (deve ser chamado quando o usuário faz login)
 */
export function setCurrentUser(user: { email?: string; id?: string; name?: string } | null | undefined) {
  if (!user) {
    currentUser = 'Anonymous';
  } else {
    // Preferir email, depois name, depois id
    currentUser = user.email || user.name || user.id || 'Unknown';
  }
  console.log(`[RequestMonitoring] 👤 Usuário atualizado para: ${currentUser}`);
}

/**
 * Obter o usuário atual
 */
export function getCurrentUser(): string {
  return currentUser;
}

/**
 * Habilitar/Desabilitar envio de métricas para Supabase
 */
export function setSupabaseSyncEnabled(enabled: boolean): void {
  isSupabaseSyncEnabled = enabled;
  console.log(`[RequestMonitoring] 🔄 Supabase Sync ${enabled ? 'HABILITADO' : 'DESABILITAR'}`);
  
  if (!enabled && supabaseSyncInterval !== null) {
    clearInterval(supabaseSyncInterval);
    supabaseSyncInterval = null;
    supabaseSyncQueue = [];
  }
}
