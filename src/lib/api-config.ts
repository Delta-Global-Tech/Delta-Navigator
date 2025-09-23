// Configuração dinâmica de URLs das APIs para funcionar em rede
export const getApiUrl = (port: string | number, envVarName?: string) => {
  // Primeiro, tenta usar a variável de ambiente se fornecida
  if (envVarName && import.meta.env[envVarName]) {
    const envUrl = import.meta.env[envVarName];
    // Se a URL do .env já contém o hostname correto para o contexto atual, usa ela
    if (typeof window !== 'undefined' && envUrl.includes(window.location.hostname)) {
      return envUrl;
    }
    // Se contém localhost e estamos no browser, substitui pelo hostname atual
    if (typeof window !== 'undefined' && envUrl.includes('localhost')) {
      return envUrl.replace('localhost', window.location.hostname);
    }
    // Senão, usa a URL do .env como está
    return envUrl;
  }
  
  // Se estiver no browser, usa o hostname atual
  if (typeof window !== 'undefined') {
    return `http://${window.location.hostname}:${port}`;
  }
  
  // Fallback para localhost (usado em SSR/build)
  return `http://localhost:${port}`;
};

// URLs das APIs com fallback inteligente
export const API_URLS = {
  SQLSERVER: getApiUrl(3001, 'VITE_API_SQLSERVER_URL'),
  POSTGRES: getApiUrl(3002, 'VITE_API_POSTGRES_URL'), 
  EXTRATO: getApiUrl(3003, 'VITE_EXTRATO_API_URL'),
} as const;

// Função para obter URL da API com path
export const getApiEndpoint = (apiType: keyof typeof API_URLS, path: string) => {
  return `${API_URLS[apiType]}${path.startsWith('/') ? path : `/${path}`}`;
};

// Utilitário para logging
export const logApiCall = (url: string, type: 'REQUEST' | 'SUCCESS' | 'ERROR' = 'REQUEST') => {
  const timestamp = new Date().toLocaleTimeString('pt-BR');
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'server';
  console.log(`[${type}] ${timestamp} - Host: ${hostname} - API: ${url}`);
};