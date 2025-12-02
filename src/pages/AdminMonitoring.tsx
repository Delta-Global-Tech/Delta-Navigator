import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { RefreshCw, Activity, Zap, Database, AlertCircle, CheckCircle, Clock, Download, Trash2, Eye, EyeOff, Server, Wifi, WifiOff } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { subscribeToMetrics, clearMetrics as clearMonitoringMetrics, exportMetrics as exportMonitoringMetrics, getTotalRequests as getGlobalTotalRequests, getCurrentUser, type MonitoringMetric } from '@/services/requestMonitoring';
import { fetchRecentMetrics, subscribeToRealtime, initializeRealtimeSync, getPCName, type RealtimeMetric } from '@/services/realtimeSync';

interface BackendMetric {
  backend: string;
  requestCount: number;
  totalTime: number;
  avgTime: number;
  errorCount: number;
  lastAccess: number;
  endpoints: string[];
}

interface PageMetric {
  page: string;
  requestCount: number;
  totalTime: number;
  avgTime: number;
  errorCount: number;
  lastAccess: number;
  backends: string[];
}

interface MemoryMetric {
  timestamp: number;
  used: number;
  limit: number;
}

const AdminMonitoring: React.FC = () => {
  const [metrics, setMetrics] = useState<MonitoringMetric[]>([]);
  const [realtimeMetrics, setRealtimeMetrics] = useState<RealtimeMetric[]>([]);
  const [backendMetrics, setBackendMetrics] = useState<BackendMetric[]>([]);
  const [pageMetrics, setPageMetrics] = useState<PageMetric[]>([]);
  const [memoryHistory, setMemoryHistory] = useState<MemoryMetric[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [showRealtime, setShowRealtime] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [filterBackend, setFilterBackend] = useState<string | null>(null);
  const [filterUser, setFilterUser] = useState<string | null>(null);
  const [filterPCName, setFilterPCName] = useState<string | null>(null);
  const [currentUser, setCurrentUserState] = useState<string>('Anonymous');
  const [currentPCName, setCurrentPCName] = useState<string>('');
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const memoryHistoryRef = useRef<MemoryMetric[]>([]);

  // Log de debug
  useEffect(() => {
    console.log('[AdminMonitoring] Métrica atualizada:', metrics.length, 'requisições');
    if (showDebug) {
      console.log('[AdminMonitoring] Detalhe:', metrics);
    }
  }, [metrics, showDebug]);

  // Atualizar usuário atual
  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUserState(user);
    const pcName = getPCName();
    setCurrentPCName(pcName);
  }, []);

  // Inicializar Realtime e buscar métricas recentes
  useEffect(() => {
    console.log('[AdminMonitoring] Inicializando Realtime...');
    
    // Inicializar conexão Realtime
    initializeRealtimeSync();
    setRealtimeConnected(true);
    
    // Buscar métricas recentes
    const loadRecentMetrics = async () => {
      const recent = await fetchRecentMetrics(5, 200); // Últimos 5 minutos
      setRealtimeMetrics(recent);
    };
    
    loadRecentMetrics();
    
    // Subscrever a mudanças em tempo real
    const unsubscribeRealtime = subscribeToRealtime((metrics) => {
      console.log('[AdminMonitoring] Realtime: novos dados recebidos:', metrics.length);
      setRealtimeMetrics(metrics);
    });
    
    return () => {
      unsubscribeRealtime();
    };
  }, []);

  // Atualizar KPIs baseado nos dados do Realtime
  useEffect(() => {
    if (realtimeMetrics.length > 0) {
      // Calcular totais a partir dos dados do Realtime
      const totalReqs = realtimeMetrics.length;
      const errorCount = realtimeMetrics.filter(m => m.status === 'error').length;
      const avgTime = realtimeMetrics.length > 0 
        ? realtimeMetrics.reduce((sum, m) => sum + m.duration, 0) / realtimeMetrics.length 
        : 0;
      
      console.log(`[AdminMonitoring] KPIs Atualizados: Total=${totalReqs}, Erros=${errorCount}, AvgTime=${avgTime.toFixed(2)}ms`);
    }
  }, [realtimeMetrics]);

  // Subscrever a mudanças de métricas do serviço global
  useEffect(() => {
    console.log('[AdminMonitoring] Subscrevendo a métricas...');
    const unsubscribe = subscribeToMetrics((newMetrics) => {
      console.log('[AdminMonitoring] Callback chamado com', newMetrics.length, 'métricas');
      setMetrics(newMetrics);

      // Calcular métricas por backend
      const backendMap = new Map<string, BackendMetric>();
      newMetrics.forEach(metric => {
        if (!backendMap.has(metric.backend)) {
          backendMap.set(metric.backend, {
            backend: metric.backend,
            requestCount: 0,
            totalTime: 0,
            avgTime: 0,
            errorCount: 0,
            lastAccess: 0,
            endpoints: []
          });
        }
        const backendMetric = backendMap.get(metric.backend)!;
        backendMetric.requestCount += metric.count;
        backendMetric.totalTime += metric.totalTime;
        backendMetric.errorCount += metric.status === 'error' ? 1 : 0;
        backendMetric.lastAccess = Math.max(backendMetric.lastAccess, metric.timestamp);
        if (!backendMetric.endpoints.includes(metric.endpoint)) {
          backendMetric.endpoints.push(metric.endpoint);
        }
      });

      const backendMetricsArray = Array.from(backendMap.values());
      backendMetricsArray.forEach(bm => {
        bm.avgTime = bm.requestCount > 0 ? bm.totalTime / bm.requestCount : 0;
      });

      setBackendMetrics(backendMetricsArray.sort((a, b) => b.requestCount - a.requestCount));

      // Calcular métricas por página
      const pageMap = new Map<string, PageMetric>();
      newMetrics.forEach(metric => {
        if (!pageMap.has(metric.page)) {
          pageMap.set(metric.page, {
            page: metric.page,
            requestCount: 0,
            totalTime: 0,
            avgTime: 0,
            errorCount: 0,
            lastAccess: 0,
            backends: []
          });
        }
        const pageMetric = pageMap.get(metric.page)!;
        pageMetric.requestCount += metric.count;
        pageMetric.totalTime += metric.totalTime;
        pageMetric.errorCount += metric.status === 'error' ? 1 : 0;
        pageMetric.lastAccess = Math.max(pageMetric.lastAccess, metric.timestamp);
        if (!pageMetric.backends.includes(metric.backend)) {
          pageMetric.backends.push(metric.backend);
        }
      });

      const pageMetricsArray = Array.from(pageMap.values());
      pageMetricsArray.forEach(pm => {
        pm.avgTime = pm.requestCount > 0 ? pm.totalTime / pm.requestCount : 0;
      });

      setPageMetrics(pageMetricsArray.sort((a, b) => b.requestCount - a.requestCount));
    });

    return unsubscribe;
  }, []);

  // Monitorar memória
  useEffect(() => {
    const monitorMemory = setInterval(() => {
      if ((performance as any).memory) {
        const memory = (performance as any).memory;
        const metric: MemoryMetric = {
          timestamp: Date.now(),
          used: memory.usedJSHeapSize,
          limit: memory.jsHeapSizeLimit
        };
        
        memoryHistoryRef.current.push(metric);
        if (memoryHistoryRef.current.length > 60) {
          memoryHistoryRef.current.shift();
        }
        
        setMemoryHistory([...memoryHistoryRef.current]);
      }
    }, 5000); // A cada 5 segundos

    return () => clearInterval(monitorMemory);
  }, []);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Forçar re-render (o state já é atualizado via subscription)
    }, 2000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return '#10B981';
      case 'error':
        return '#EF4444';
      case 'pending':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  const getMemoryUsagePercentage = () => {
    if (memoryHistory.length === 0) return 0;
    const latest = memoryHistory[memoryHistory.length - 1];
    return (latest.used / latest.limit) * 100;
  };

  const getTotalErrors = () => {
    // Usar dados do Realtime primeiro
    if (realtimeMetrics.length > 0) {
      return realtimeMetrics.filter(m => m.status === 'error').length;
    }
    // Fallback para dados locais
    return metrics.filter(m => m.status === 'error').reduce((sum, m) => sum + m.count, 0);
  };

  const getTotalRequests = () => {
    // Usar dados do Realtime primeiro
    if (realtimeMetrics.length > 0) {
      return realtimeMetrics.length;
    }
    // Fallback para dados locais
    return getGlobalTotalRequests();
  };

  const getAvgResponseTime = () => {
    // Usar dados do Realtime primeiro
    if (realtimeMetrics.length > 0) {
      const total = realtimeMetrics.reduce((sum, m) => sum + m.duration, 0);
      return total / realtimeMetrics.length;
    }
    // Fallback para dados locais
    const total = metrics.reduce((sum, m) => sum + m.avgTime, 0);
    return metrics.length > 0 ? total / metrics.length : 0;
  };

  const exportMetrics = () => {
    const data: any = exportMonitoringMetrics();
    data.pageMetrics = pageMetrics;
    data.memoryHistory = memoryHistory;
    data.summary.totalErrors = getTotalErrors();
    data.summary.avgResponseTime = getAvgResponseTime();
    data.summary.memoryUsage = memoryHistory[memoryHistory.length - 1] || {};

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `monitoring-${Date.now()}.json`;
    a.click();
  };

  const clearMetrics = () => {
    if (confirm('Tem certeza que deseja limpar todas as métricas?')) {
      clearMonitoringMetrics();
      memoryHistoryRef.current = [];
      setMetrics([]);
      setBackendMetrics([]);
      setPageMetrics([]);
      setMemoryHistory([]);
    }
  };

  const testFetch = () => {
    console.log('[AdminMonitoring] 🧪 Iniciando teste de fetch...');
    console.log('[AdminMonitoring] window.fetch tipo:', typeof window.fetch);
    console.log('[AdminMonitoring] window.fetch stringified:', window.fetch.toString().substring(0, 100));
    fetch('http://localhost:3001/api/positions')
      .then(r => r.json())
      .then(d => console.log('[AdminMonitoring] ✅ Teste de fetch OK:', d))
      .catch(e => console.log('[AdminMonitoring] ❌ Teste de fetch ERRO:', e));
  };

  // Adicionar um monitor visual pra saber quando há requisições
  useEffect(() => {
    const interval = setInterval(() => {
      const user = getCurrentUser();
      const total = getGlobalTotalRequests();
      console.log(`[AdminMonitoring] 📊 Status: User=${user}, TotalRequests=${total}, MetricsCount=${metrics.length}`);
    }, 5000); // A cada 5 segundos

    return () => clearInterval(interval);
  }, [metrics]);

  return (
    <div 
      className="space-y-8 p-8 relative overflow-hidden animate-slideInFromBottom"
      style={{ 
        background: 'linear-gradient(135deg, #031226 0%, #0a1b33 20%, #142b4a 40%, #1a3454 60%, #0a1b33 80%, #031226 100%)',
        minHeight: '100vh'
      }}
    >
      {/* Particles Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${Math.random() * 4 + 1}px`,
              height: `${Math.random() * 4 + 1}px`,
              background: ['#10B981', '#F59E0B', '#EF4444', 'rgba(16, 185, 129, 0.7)'][Math.floor(Math.random() * 4)],
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.6 + 0.2,
              boxShadow: `0 0 ${Math.random() * 20 + 10}px currentColor`,
              animation: `float ${4 + Math.random() * 8}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 4}s`
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="text-center py-8 rounded-xl relative z-10" style={{ 
        background: 'linear-gradient(135deg, #031226 0%, #0a1b33 50%, #031226 100%)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
      }}>
        <h1 
          className="text-4xl font-bold mb-2"
          style={{ 
            color: '#FFFFFF',
            textShadow: '0 0 20px rgba(16, 185, 129, 0.5)'
          }}
        >
          🖥️ Monitoramento DBA
        </h1>
        <p 
          className="text-lg"
          style={{ color: 'rgba(16, 185, 129, 0.8)' }}
        >
          Dashboard de Monitoramento de Requisições e Recursos
        </p>
        <Button
          onClick={() => setShowDebug(!showDebug)}
          variant="ghost"
          size="sm"
          style={{ color: '#F59E0B', marginTop: '8px' }}
        >
          {showDebug ? '🔍 Debug ON' : '🔍 Debug OFF'}
        </Button>
      </div>

      {/* Debug Panel */}
      {showDebug && (
        <Card style={{ background: 'linear-gradient(135deg, #2d1b00 0%, #1a0f00 50%, #2d1b00 100%)', border: '2px solid #F59E0B' }} className="relative z-10">
          <CardHeader>
            <CardTitle style={{ color: '#F59E0B' }}>🐛 Debug Panel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm" style={{ color: '#fff' }}>
              <div>📊 Métricas capturadas: <strong>{metrics.length}</strong></div>
              <div>🔗 Total requisições: <strong>{getTotalRequests()}</strong></div>
              <div>📄 Página atual: <strong>{sessionStorage.getItem('currentPage') || 'Unknown'}</strong></div>
              <div>🎯 Backends detectados: <strong>{backendMetrics.length}</strong></div>
              <div>📍 Páginas detectadas: <strong>{pageMetrics.length}</strong></div>
              <div>🔄 Auto-refresh: <strong>{autoRefresh ? 'ON' : 'OFF'}</strong></div>
              <div style={{ marginTop: '12px', padding: '8px', background: 'rgba(0,0,0,0.3)', borderRadius: '4px' }}>
                <div style={{ fontSize: '10px', color: '#999' }}>Abra o console (F12) para ver logs detalhados</div>
                <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <Button 
                    onClick={() => {
                      console.log('[DEBUG] === CHECKLIST DE INTERCEPTAÇÃO ===');
                      console.log('[DEBUG] 1. window.fetch existe?', typeof window.fetch !== 'undefined');
                      console.log('[DEBUG] 2. __originalFetch existe?', (window as any).__originalFetch ? 'SIM' : 'NÃO');
                      console.log('[DEBUG] 3. __monitoringInterceptorLocked?', (window as any).__monitoringInterceptorLocked ? 'SIM' : 'NÃO');
                      console.log('[DEBUG] 4. window.fetch toString:', window.fetch.toString().substring(0, 80));
                      console.log('[DEBUG] === FIM CHECKLIST ===');
                    }}
                    size="sm"
                    style={{ background: '#8B5CF6', color: '#fff', fontSize: '12px' }}
                  >
                    🔐 Verificar Interceptor
                  </Button>
                  <Button 
                    onClick={testFetch}
                    size="sm"
                    style={{ background: '#10B981', color: '#000', fontSize: '12px' }}
                  >
                    🧪 Teste Fetch
                  </Button>
                  <Button 
                    onClick={clearMetrics}
                    size="sm"
                    style={{ background: '#EF4444', color: '#fff', fontSize: '12px' }}
                  >
                    🗑️ Limpar
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Realtime Monitor Section */}
      {showRealtime && (
        <Card style={{ background: 'linear-gradient(135deg, #0a2e1a 0%, #0f4d2e 50%, #0a2e1a 100%)', border: '2px solid #10B981' }} className="relative z-10">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <CardTitle style={{ color: '#10B981' }}>🌐 Monitoramento em Tempo Real</CardTitle>
                {realtimeConnected ? (
                  <div className="flex items-center gap-2" style={{ color: '#10B981' }}>
                    <Wifi size={16} />
                    <span className="text-sm">Conectado</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2" style={{ color: '#EF4444' }}>
                    <WifiOff size={16} />
                    <span className="text-sm">Desconectado</span>
                  </div>
                )}
              </div>
              <Button
                onClick={() => setShowRealtime(!showRealtime)}
                size="sm"
                variant="ghost"
                style={{ color: '#10B981' }}
              >
                {showRealtime ? '👁️ Ocultar' : '👁️ Mostrar'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Seu PC</div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#10B981', marginTop: '4px' }}>{currentPCName || 'Carregando...'}</div>
                </div>
                <div style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Usuário</div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#10B981', marginTop: '4px' }}>{currentUser}</div>
                </div>
                <div style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Dados Sincronizados</div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#10B981', marginTop: '4px' }}>{realtimeMetrics.length} requisições</div>
                </div>
              </div>

              {/* Tabela de Requisições Globais */}
              <div style={{ marginTop: '20px' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#10B981', marginBottom: '12px' }}>📊 Últimas Requisições Sincronizadas</div>
                <div style={{ overflowX: 'auto', maxHeight: '400px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(16, 185, 129, 0.2)', background: 'rgba(0,0,0,0.2)' }}>
                        <th style={{ padding: '8px', textAlign: 'left', color: '#10B981' }}>PC</th>
                        <th style={{ padding: '8px', textAlign: 'left', color: '#10B981' }}>Backend</th>
                        <th style={{ padding: '8px', textAlign: 'left', color: '#10B981' }}>Endpoint</th>
                        <th style={{ padding: '8px', textAlign: 'left', color: '#10B981' }}>Usuário</th>
                        <th style={{ padding: '8px', textAlign: 'left', color: '#10B981' }}>Status</th>
                        <th style={{ padding: '8px', textAlign: 'right', color: '#10B981' }}>Tempo (ms)</th>
                        <th style={{ padding: '8px', textAlign: 'left', color: '#10B981' }}>Horário</th>
                      </tr>
                    </thead>
                    <tbody>
                      {realtimeMetrics.slice(0, 20).map((metric, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(16, 185, 129, 0.1)' }}>
                          <td style={{ padding: '8px', color: metric.pc_name === currentPCName ? '#10B981' : '#FCA5A5' }}>
                            {metric.pc_name}
                            {metric.pc_name === currentPCName && ' (Você)'}
                          </td>
                          <td style={{ padding: '8px', color: '#3B82F6' }}>
                            <Badge style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#3B82F6', fontSize: '10px' }}>
                              {metric.backend}
                            </Badge>
                          </td>
                          <td style={{ padding: '8px', color: 'rgba(255,255,255,0.7)', maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {metric.endpoint}
                          </td>
                          <td style={{ padding: '8px', color: 'rgba(255,255,255,0.7)' }}>
                            {metric.user_name}
                          </td>
                          <td style={{ padding: '8px' }}>
                            <Badge style={{ 
                              background: metric.status === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                              color: metric.status === 'success' ? '#10B981' : '#EF4444',
                              fontSize: '10px'
                            }}>
                              {metric.status}
                            </Badge>
                          </td>
                          <td style={{ padding: '8px', textAlign: 'right', color: metric.duration > 1000 ? '#F59E0B' : '#10B981' }}>
                            {metric.duration.toFixed(0)}
                          </td>
                          <td style={{ padding: '8px', color: 'rgba(255,255,255,0.6)', fontSize: '11px' }}>
                            {new Date(metric.created_at).toLocaleTimeString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
        <Card style={{ background: 'linear-gradient(135deg, #031226 0%, #0a1b33 50%, #031226 100%)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: '#10B981' }}>Total Requisições</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{getTotalRequests()}</div>
            <p className="text-xs mt-1" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Todas as páginas</p>
          </CardContent>
        </Card>

        <Card style={{ background: 'linear-gradient(135deg, #031226 0%, #0a1b33 50%, #031226 100%)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: '#EF4444' }}>Erros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{getTotalErrors()}</div>
            <p className="text-xs mt-1" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Requisições com erro</p>
          </CardContent>
        </Card>

        <Card style={{ background: 'linear-gradient(135deg, #031226 0%, #0a1b33 50%, #031226 100%)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: '#F59E0B' }}>Tempo Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatTime(getAvgResponseTime())}</div>
            <p className="text-xs mt-1" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Por requisição</p>
          </CardContent>
        </Card>

        <Card style={{ background: 'linear-gradient(135deg, #031226 0%, #0a1b33 50%, #031226 100%)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: '#3B82F6' }}>Memória</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{Math.round(getMemoryUsagePercentage())}%</div>
            <p className="text-xs mt-1" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Heap JS em uso</p>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex gap-2 relative z-10 flex-wrap">
        <Button 
          onClick={() => setAutoRefresh(!autoRefresh)}
          style={{ background: autoRefresh ? '#10B981' : '#6B7280', border: 'none' }}
        >
          <Activity className="mr-2" size={16} />
          {autoRefresh ? 'Auto-refresh: ON' : 'Auto-refresh: OFF'}
        </Button>
        <Button 
          onClick={() => setShowDetails(!showDetails)}
          style={{ borderColor: '#10B981', color: '#10B981' }}
          variant="outline"
        >
          {showDetails ? <EyeOff className="mr-2" size={16} /> : <Eye className="mr-2" size={16} />}
          {showDetails ? 'Ocultar' : 'Ver'} Detalhes
        </Button>
        <Button 
          onClick={exportMetrics}
          style={{ borderColor: '#3B82F6', color: '#3B82F6' }}
          variant="outline"
        >
          <Download className="mr-2" size={16} />
          Exportar
        </Button>
        <Button 
          onClick={clearMetrics}
          style={{ borderColor: '#EF4444', color: '#EF4444' }}
          variant="outline"
        >
          <Trash2 className="mr-2" size={16} />
          Limpar
        </Button>
      </div>

      {/* Memory Chart */}
      {memoryHistory.length > 0 && (
        <Card style={{ background: 'linear-gradient(135deg, #031226 0%, #0a1b33 50%, #031226 100%)', border: '1px solid rgba(16, 185, 129, 0.3)' }} className="relative z-10">
          <CardHeader>
            <CardTitle style={{ color: '#3B82F6' }}>Uso de Memória (Heap JS)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={memoryHistory}>
                <CartesianGrid stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="timestamp" 
                  stroke="rgba(255,255,255,0.6)"
                  tickFormatter={(ts) => new Date(ts).toLocaleTimeString()}
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.6)"
                  tickFormatter={(value) => formatBytes(value)}
                />
                <Tooltip 
                  formatter={(value) => formatBytes(value as number)}
                  labelFormatter={(label) => new Date(label).toLocaleTimeString()}
                  contentStyle={{ background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(16, 185, 129, 0.3)' }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="used" 
                  stroke="#3B82F6" 
                  name="Usado"
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="limit" 
                  stroke="#10B981" 
                  name="Limite"
                  dot={false}
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Requests by Backend */}
      {backendMetrics.length > 0 && (
        <Card style={{ background: 'linear-gradient(135deg, #031226 0%, #0a1b33 50%, #031226 100%)', border: '1px solid rgba(59, 130, 246, 0.3)' }} className="relative z-10">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle style={{ color: '#3B82F6' }}>Requisições por Backend</CardTitle>
              <div className="flex gap-2">
                {backendMetrics.map(bm => (
                  <Badge 
                    key={bm.backend}
                    style={{ 
                      background: filterBackend === bm.backend ? '#3B82F6' : 'rgba(59, 130, 246, 0.2)', 
                      color: filterBackend === bm.backend ? 'white' : '#3B82F6',
                      cursor: 'pointer'
                    }}
                    onClick={() => setFilterBackend(filterBackend === bm.backend ? null : bm.backend)}
                  >
                    <Server size={14} className="mr-1" />
                    {bm.backend}
                  </Badge>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {backendMetrics.map((metric, idx) => (
                <div key={idx} className="p-4 rounded" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <Server size={18} style={{ color: '#3B82F6' }} />
                      <span style={{ color: '#3B82F6', fontWeight: 'bold' }}>{metric.backend}</span>
                    </div>
                    <div className="flex gap-2">
                      <Badge style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#3B82F6' }}>
                        {metric.requestCount} requisições
                      </Badge>
                      {metric.errorCount > 0 && (
                        <Badge style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#EF4444' }}>
                          {metric.errorCount} erros
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between text-sm" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    <span>Tempo Total: {formatTime(metric.totalTime)}</span>
                    <span>Tempo Médio: {formatTime(metric.avgTime)}</span>
                    <span>Endpoints: {metric.endpoints.length}</span>
                    <span>Última: {new Date(metric.lastAccess).toLocaleTimeString()}</span>
                  </div>
                  <div className="mt-2 w-full bg-gray-700 rounded h-2" style={{ background: 'rgba(255, 255, 255, 0.1)' }}>
                    <div 
                      className="h-2 rounded" 
                      style={{ 
                        width: `${Math.min((metric.requestCount / Math.max(...backendMetrics.map(m => m.requestCount), 1)) * 100, 100)}%`,
                        background: `linear-gradient(90deg, #3B82F6, #10B981)`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Requests by Page */}
      {pageMetrics.length > 0 && (
        <Card style={{ background: 'linear-gradient(135deg, #031226 0%, #0a1b33 50%, #031226 100%)', border: '1px solid rgba(16, 185, 129, 0.3)' }} className="relative z-10">
          <CardHeader>
            <CardTitle style={{ color: '#10B981' }}>Requisições por Página</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pageMetrics.map((metric, idx) => (
                <div key={idx} className="p-4 rounded" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <div className="flex justify-between items-center mb-2">
                    <span style={{ color: '#10B981', fontWeight: 'bold' }}>{metric.page}</span>
                    <div className="flex gap-2">
                      <Badge style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10B981' }}>
                        {metric.requestCount} requisições
                      </Badge>
                      {metric.errorCount > 0 && (
                        <Badge style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#EF4444' }}>
                          {metric.errorCount} erros
                        </Badge>
                      )}
                      <Badge style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#3B82F6' }}>
                        {metric.backends.length} backend{metric.backends.length > 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    <span>Tempo Total: {formatTime(metric.totalTime)}</span>
                    <span>Tempo Médio: {formatTime(metric.avgTime)}</span>
                    <span>Última: {new Date(metric.lastAccess).toLocaleTimeString()}</span>
                  </div>
                  <div className="mt-2 w-full bg-gray-700 rounded h-2" style={{ background: 'rgba(255, 255, 255, 0.1)' }}>
                    <div 
                      className="h-2 rounded" 
                      style={{ 
                        width: `${Math.min((metric.requestCount / Math.max(...pageMetrics.map(m => m.requestCount), 1)) * 100, 100)}%`,
                        background: `linear-gradient(90deg, #10B981, #3B82F6)`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Requests (Optional) */}
      {showDetails && metrics.length > 0 && (
        <Card style={{ background: 'linear-gradient(135deg, #031226 0%, #0a1b33 50%, #031226 100%)', border: '1px solid rgba(59, 130, 246, 0.3)' }} className="relative z-10">
          <CardHeader>
            <CardTitle style={{ color: '#3B82F6' }}>Detalhes de Requisições ({metrics.filter(m => !filterBackend || m.backend === filterBackend).length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(59, 130, 246, 0.3)' }}>
                    <th className="p-2 text-left" style={{ color: '#3B82F6' }}>Backend</th>
                    <th className="p-2 text-left" style={{ color: '#3B82F6' }}>Página</th>
                    <th className="p-2 text-left" style={{ color: '#3B82F6' }}>Usuário</th>
                    <th className="p-2 text-left" style={{ color: '#3B82F6' }}>Endpoint</th>
                    <th className="p-2 text-center" style={{ color: '#3B82F6' }}>Count</th>
                    <th className="p-2 text-center" style={{ color: '#3B82F6' }}>Tempo Total</th>
                    <th className="p-2 text-center" style={{ color: '#3B82F6' }}>Tempo Médio</th>
                    <th className="p-2 text-center" style={{ color: '#3B82F6' }}>Último</th>
                    <th className="p-2 text-center" style={{ color: '#3B82F6' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics
                    .filter(m => !filterBackend || m.backend === filterBackend)
                    .sort((a, b) => b.count - a.count)
                    .map((metric, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <td className="p-2" style={{ color: '#3B82F6' }}>
                        <Badge style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#3B82F6' }}>
                          {metric.backend}
                        </Badge>
                      </td>
                      <td className="p-2" style={{ color: '#10B981' }}>{metric.page}</td>
                      <td className="p-2" style={{ color: '#F59E0B' }}>{metric.user}</td>
                      <td className="p-2 text-xs" style={{ color: 'rgba(255, 255, 255, 0.7)' }} title={metric.endpoint}>
                        {metric.endpoint.length > 40 ? metric.endpoint.slice(-40) + '...' : metric.endpoint}
                      </td>
                      <td className="p-2 text-center" style={{ color: 'white' }}>{metric.count}</td>
                      <td className="p-2 text-center" style={{ color: '#F59E0B' }}>{formatTime(metric.totalTime)}</td>
                      <td className="p-2 text-center" style={{ color: '#3B82F6' }}>{formatTime(metric.avgTime)}</td>
                      <td className="p-2 text-center" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>{formatTime(metric.lastTime)}</td>
                      <td className="p-2 text-center">
                        <Badge style={{ background: `${getStatusColor(metric.status)}20`, color: getStatusColor(metric.status) }}>
                          {metric.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {metrics.length === 0 && (
        <Card style={{ background: 'linear-gradient(135deg, #031226 0%, #0a1b33 50%, #031226 100%)', border: '1px solid rgba(245, 158, 11, 0.3)' }} className="relative z-10">
          <CardContent className="py-12">
            <div className="text-center" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              <Clock size={48} className="mx-auto mb-4" style={{ color: '#F59E0B' }} />
              <p>Navegue por outras páginas para ver as métricas</p>
              <p className="text-sm mt-2">As requisições serão registradas automaticamente</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminMonitoring;
