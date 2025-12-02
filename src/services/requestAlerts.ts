/**
 * Sistema de Alertas Visual - Backend Request Monitoring
 * Mostra notificação visual toda vez que um backend é chamado
 */

export interface RequestAlert {
  id: string;
  backend: string;
  endpoint: string;
  status: 'success' | 'error' | 'pending';
  duration: number;
  timestamp: number;
}

let requestAlerts: RequestAlert[] = [];
let alertListeners: ((alerts: RequestAlert[]) => void)[] = [];

export function subscribeToRequestAlerts(callback: (alerts: RequestAlert[]) => void) {
  alertListeners.push(callback);
  return () => {
    alertListeners = alertListeners.filter(l => l !== callback);
  };
}

export function getRequestAlerts(): RequestAlert[] {
  return requestAlerts;
}

export function addRequestAlert(backend: string, endpoint: string, status: 'success' | 'error' | 'pending', duration: number) {
  const alert: RequestAlert = {
    id: `${Date.now()}-${Math.random()}`,
    backend,
    endpoint: endpoint.substring(endpoint.lastIndexOf('/') + 1) || endpoint,
    status,
    duration,
    timestamp: Date.now()
  };

  requestAlerts.unshift(alert); // Adicionar no início

  // Manter apenas os últimos 10 alertas
  if (requestAlerts.length > 10) {
    requestAlerts = requestAlerts.slice(0, 10);
  }

  // Notificar listeners
  alertListeners.forEach(listener => listener([...requestAlerts]));

  // Remover após 5 segundos
  setTimeout(() => {
    requestAlerts = requestAlerts.filter(a => a.id !== alert.id);
    alertListeners.forEach(listener => listener([...requestAlerts]));
  }, 5000);
}

export function clearRequestAlerts() {
  requestAlerts = [];
  alertListeners.forEach(listener => listener([]));
}
